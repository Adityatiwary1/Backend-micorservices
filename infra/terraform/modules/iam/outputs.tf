output "eks_cluster_role_arn" {
  value =  aws_iam_role.eks-cluster-role.arn 
}

output "eks_nodegroup_role_arn" {
  value =  aws_iam_role.eks-nodegroup-role.arn 
}
output "ebs_arn" {
  value =  aws_iam_role.ebs-driver-role.arn 
}
output "cni_arn" {
  value =  aws_iam_role.vps-cni-role.arn 
}
output "secrets_arn" {
  value =  aws_iam_role.external_secrets.arn 
}