
env      = "production"
region   = "ap-south-1"
vpc_cidr = "10.0.0.0/16"

public_subnet = ["10.0.1.0/24"]

private_subnet = ["10.0.2.0/24"] #, "10.0.5.0/24", "10.0.6.0/24"]

#eks
cluster_name = "social-media-microservices"

#BASTION
bastion_image_id      = "ami-02b8269d5e85954ef" # change this to your own ami id ubuntu machine
bastion_instance_type = "t2.micro"
bastion_tags          = { Name = "bastion-dev" }
bastion_key_name      = "new-keypair" # create your own key pair


#eks

cluster_version         = "1.36"
endpoint_private_access = true
endpoint_public_access  = true
authentication_mode     = "API_AND_CONFIG_MAP"

ondemand_instance_types = ["t3a.medium"]

desired_capacity_on_demand = "3"
min_capacity_on_demand     = "2"
max_capacity_on_demand     = "4"


addons = [

  {
    name    = "coredns"
    version = "v1.14.3-eksbuild.3"
  },
  {
    name    = "kube-proxy"
    version = "v1.36.0-eksbuild.14"
  }

]
addon_cni = {
  name    = "vpc-cni",
  version = "v1.22.4-eksbuild.3"
}
addon_ebs = {
  name    = "aws-ebs-csi-driver"
  version = "v1.47.0-eksbuild.1"
}



