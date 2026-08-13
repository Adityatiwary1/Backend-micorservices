resource "helm_release" "lb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.7.2" # Use the latest stable version available

  set=[ {
    name  = "clusterName"
    value = var.cluster_name
  },

  {
    name  = "serviceAccount.create"
    value = "true"
  },

  {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  },

 {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = var.iam_role_arn
  },

 {
    name  = "vpcId"
    value = var.vpc_id
  },

  {
    name  = "region"
    value = var.region
  }]
}