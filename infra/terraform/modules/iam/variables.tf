variable "cluster_name" {
  type = string
}


variable "oidc_provider_url" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}


variable "vpc_id" {
  type = string
}
variable "aws_secret_region" {
  type = string
}
variable "aws_ecrimage_region" {
  type = string
}
variable "reponame" {
  type = string
}
#as per the curr design i am role for ext secret has been created in account associated with terraform provider which creates eks
#also the iam role create trusts the same account oidc
#now the main issue as the iam role has been created in the accoutn whihc creates eks the permission policy is also tied to the account ID 
#so aws_account_id msut match the provider aws account id to be used in permission policy as ssm associated with rpvider is being accessed 
# a good practise is to not give arn of another aws account in permission policy give its own resources
#provider iam role(is associated with an account) is creaing the iam role and permission policy (whihc requires aws_accoutn_id)
#so aws account must match 

variable "aws_account_id" {
  type = string
}
#this aws acooutn id can be differnt when the different account B already has iam role and permission policy which trust the account A oidc provider as ext secret
# is using OIDC and gives s permission policy to change and access ssm associated 
#in this cas eiam role permission policy have alread been created we need to just give its arn to current service account