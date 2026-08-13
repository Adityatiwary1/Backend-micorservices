resource "aws_eks_cluster" "eks" {

  #count    = var.is_eks_cluster_enabled == true ? 1 : 0
  name     = var.cluster_name
  role_arn = var.eks_cluster_role_arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_private_access = var.endpoint_private_access
    endpoint_public_access  = var.endpoint_public_access
    security_group_ids      = var.security_group_ids
  }


  access_config {
    authentication_mode                         = var.authentication_mode
    bootstrap_cluster_creator_admin_permissions = true
  }

  tags = {
    Name = var.cluster_name
    Env  = var.env
  }
}
data "tls_certificate" "eks_certificate" {
  url = aws_eks_cluster.eks.identity[0].oidc[0].issuer
}
resource "aws_iam_openid_connect_provider" "eks-oidc" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_certificate.certificates[0].sha1_fingerprint]
  url             = data.tls_certificate.eks_certificate.url
}


# AddOns for EKS Cluster
resource "aws_eks_addon" "eks-addons" {
  for_each      = { for idx, addon in var.addons : idx => addon }
  cluster_name  = aws_eks_cluster.eks.name
  addon_name    = each.value.name
  addon_version = each.value.version

  depends_on = [
    aws_eks_node_group.ondemand-node,
    #aws_eks_node_group.spot-node
  ]
}

##can count =length(var.addons)
#addon_name =var.addons[count].name
resource "aws_eks_node_group" "ondemand-node" {
  cluster_name    = aws_eks_cluster.eks.name
  node_group_name = "${var.cluster_name}-on-demand-nodes"

  node_role_arn = var.eks_node_role_arn

  scaling_config {
    desired_size = var.desired_capacity_on_demand
    min_size     = var.min_capacity_on_demand
    max_size     = var.max_capacity_on_demand
  }

  subnet_ids = var.subnet_ids

  instance_types = var.ondemand_instance_types
  capacity_type  = "ON_DEMAND"
  labels = {
    type = "ondemand"
  }

  update_config {
    max_unavailable = 1
  }
  tags = {
    "Name" = "${var.cluster_name}-ondemand-nodes"
  }
  tags_all = {
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    "Name"                                      = "${var.cluster_name}-ondemand-nodes"
  }

  depends_on = [aws_eks_cluster.eks]
}