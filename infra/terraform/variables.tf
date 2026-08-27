
variable "vpc_cidr" {
  type = string
}

variable "public_subnet" {
  type = list(string)
}
variable "private_subnet" {
  type = list(string)
}

variable "cluster_name" {
  type = string
}

variable "env" {
  type = string
}
#eks
variable "cluster_version" {}
variable "endpoint_private_access" {}
variable "endpoint_public_access" {}
variable "authentication_mode" {}

variable "ondemand_instance_types" {}
variable "desired_capacity_on_demand" {}
variable "min_capacity_on_demand" {}
variable "max_capacity_on_demand" {}

variable "addons" {
  type = list(object({
    name    = string
    version = string
  }))
}
variable "addon_ebs" {
  type = object({
    name    = string
    version = string
  })
}
variable "addon_cni" {
  type = object({
    name    = string
    version = string
  })
}
variable "aws_secret_region" {
  type = string
}
variable "aws_account_id" { #used in permsison policy of i am role resource arn of account being sued by terraform provider
  type = string
}
variable "terraform_role_arn" {
  type = string #iam account for terraform to interact with aws
}
variable "aws_ecrimage_region" {
  type = string
}
variable "ecrrepo_name" {
  type = string
}
variable "aws_eksvpcsglb_region" {
  type = string
}
variable "github_token" {
  type = string
}
variable "github_username" {
  type = string
}