resource "aws_eks_addon" "ebs" {
  cluster_name  = var.cluster_name
  addon_name    = var.addon_ebs.name
  addon_version = var.addon_ebs.version

  service_account_role_arn = var.ebs_role_arn
}
resource "aws_eks_addon" "cni" {
  cluster_name  = var.cluster_name
  addon_name    = var.addon_cni.name
  addon_version = var.addon_cni.version

  service_account_role_arn = var.cni_role_arn
}