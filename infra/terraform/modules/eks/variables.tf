variable "cluster_name" {
  type = string
}
variable "env" {
  type = string
}

variable "cluster_version" {
  type = string
}

variable "endpoint_private_access" {
  type = bool
}

variable "endpoint_public_access" {
  type = bool
}

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
variable "ondemand_instance_types" {
  type = list(string)
}
variable "desired_capacity_on_demand" {
  type = string
}

variable "min_capacity_on_demand" {
  type = string
}

variable "max_capacity_on_demand" {
  type = string
}
variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

variable "eks_cluster_role_arn" {
  type = string
}

variable "eks_node_role_arn" {
  type = string
}


variable "authentication_mode" {
  type = string
}
