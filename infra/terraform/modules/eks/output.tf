output "cluster_endpoint" {
  value = aws_eks_cluster.eks.endpoint 
}

output "cluster_name" {
  value =  aws_eks_cluster.eks.name
}

output "oidc_provider_url" {
  value = aws_iam_openid_connect_provider.eks-oidc.url
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.eks-oidc.arn
}

output "cluster_certificate_authority_data" {
  value = aws_eks_cluster.eks.certificate_authority[0].data
}