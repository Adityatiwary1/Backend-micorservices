terraform {
  required_version = ">= 1.15.8"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.1"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.38"
    }
  }
}
#added if you wato change confguration of invoked provider
provider "aws" {


  #assume_role {
  # role_arn = var.terraform_role_arn #not needed in github oidc #no need to call assume role api with a valid principal i e iam user in thi case
  #}
  #provider is configured to get access key temp from env 
}

#. terrafrom init where terraform will run
module "vpc" {
  source         = "./modules/vpc"
  env            = var.env
  vpc_cidr       = var.vpc_cidr
  public_subnet  = var.public_subnet
  private_subnet = var.private_subnet
  cluster_name   = "${var.env}-${var.cluster_name}"
}
#variable values to module are provided through here tfvar->main variables->module var
#moudle ouput-> other module var value
module "sg" {
  source = "./modules/security-group"

  env    = var.env
  vpc_id = module.vpc.vpc_id
}
module "iam" {
  source = "./modules/iam"

  cluster_name        = "${var.env}-${var.cluster_name}"
  aws_secret_region   = var.aws_secret_region
  aws_account_id      = var.aws_account_id
  vpc_id              = module.vpc.vpc_id
  oidc_provider_url   = module.eks.oidc_provider_url
  oidc_provider_arn   = module.eks.oidc_provider_arn
  aws_ecrimage_region = var.aws_ecrimage_region
  reponame            = var.ecrrepo_name
  depends_on          = [module.vpc]
}
module "eks" {
  source = "./modules/eks"

  env          = var.env
  cluster_name = "${var.env}-${var.cluster_name}"

  subnet_ids           = module.vpc.private_subnets
  security_group_ids   = [module.sg.eks_cluster_sg_id]
  eks_cluster_role_arn = module.iam.eks_cluster_role_arn
  eks_node_role_arn    = module.iam.eks_nodegroup_role_arn


  cluster_version            = var.cluster_version
  endpoint_private_access    = var.endpoint_private_access
  endpoint_public_access     = var.endpoint_public_access
  authentication_mode        = var.authentication_mode
  ondemand_instance_types    = var.ondemand_instance_types
  desired_capacity_on_demand = var.desired_capacity_on_demand
  min_capacity_on_demand     = var.min_capacity_on_demand
  max_capacity_on_demand     = var.max_capacity_on_demand
  addons                     = var.addons
  addon_ebs                  = var.addon_ebs
  addon_cni                  = var.addon_cni
  depends_on                 = [module.vpc]
}
module "eks-addon" {
  source       = "./modules/eks-addons-service"
  cluster_name = module.eks.cluster_name
  ebs_role_arn = module.iam.ebs_arn
  cni_role_arn = module.iam.cni_arn
  addon_cni    = var.addon_cni
  addon_ebs    = var.addon_ebs

}
module "storageclass" {
  source        = "./modules/storageclass"
  addon_ebsname = module.eks-addon.addon_ebsname # why from module as addon to be created first
}
module "serviceaccount" {
  source            = "./modules/service-account"
  external_role_arn = module.iam.secrets_arn
}
module "helmv1" {
  source            = "./modules/external-sec-op"
  name              = module.serviceaccount.kubernetes_service_account
  namespace         = module.serviceaccount.namespace
  aws_secret_region = var.aws_secret_region #current ssdk has aws region but this region is diif and   for kubernetes sevrice account
  # and the pods sdk aws cli to contact and amke region specifi api calls to secretmanager service when the app rusn not part of cd but it has to be given in trust policy and also to cluster store api object CRD for pods sdk aws to know which region
  #after pod sdk gets region it gets token tmp credentials then it make region specifi api call which isthen checked by secret manager service +identity managerments evrice with your permssion policy
  depends_on = [module.eks-addon]
}
module "lb_controller_role" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name                              = "aws-load-balancer-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }
}
module "lb-controller" {
  source       = "./modules/awslb-controller"
  region       = var.aws_eksvpcsglb_region
  cluster_name = module.eks.cluster_name
  iam_role_arn = module.lb_controller_role.iam_role_arn
  vpc_id       = module.vpc.vpc_id
  depends_on   = [module.eks-addon] #all add osn must be insatlled first for pods
}
module "argocd" {
  source              = "./modules/argocd"
  depends_on          = [module.lb-controller] # we want argocd to be accessible as well but if not reachbale from outside it just wates then dependency has no need
  aws_account_id      = var.aws_account_id
  aws_ecrimage_region = var.aws_ecrimage_region
  reponame            = var.ecrrepo_name
  github_token        = var.github_token
  github_username     = var.github_username
  ecr_role_arn        = module.iam.ecr_arn
}
provider "helm" {
  kubernetes = {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec = {
      api_version = "client.authentication.k8s.io/v1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks.cluster_name
      ]
    }
  }
}
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_name
    ]
  }
}