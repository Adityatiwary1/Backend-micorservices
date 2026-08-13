variable "ebs_role_arn" {
  type = string
}
variable "cni_role_arn" {
  type = string
}
variable "cluster_name" {
  type = string
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