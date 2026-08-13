resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  instance_tenancy     = "default"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-${var.env}-${terraform.workspace}"
    environment = "${var.env}-${terraform.workspace}"
  }
}
data "aws_availability_zones" "available" {
  state = "available"
}
#for resource label2 name you give it
#count tells to create many count keeps on updating #accesses by resoruce_name.label2[i]
resource "aws_subnet" "public_subnet" {
  count                   = length(var.public_subnet)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet[count.index]
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                        = "public-${var.env}-${count.index + 1}"
    Env                                         = var.env
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    #"kubernetes.io/role/elb"                    = "1" # For internet facing ALB
  }

  depends_on = [aws_vpc.main]
}
resource "aws_subnet" "private_subnet" {
  count                   = length(var.private_subnet)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  tags = {
    Name                                        = "private-${var.env}-${count.index + 1}"
    Env                                         = var.env
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    #"kubernetes.io/role/internal-elb"           = "1" # For internal facing ALB
  }

  depends_on = [aws_vpc.main]
}
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name                                        = "igw-${var.env}-${terraform.workspace}"
    env                                         = var.env
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
  }

  depends_on = [aws_vpc.main]
}
#label1 is th res type so restype,label2 for resource
resource "aws_eip" "nat_eip" {#nat needs a stable ip 
  domain = "vpc"

  tags = {
    Name = "nat_eip-${var.env}-${terraform.workspace}"
  }

  depends_on = [aws_vpc.main]

}

resource "aws_nat_gateway" "nat_gateway" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet[0].id

  tags = {
    Name = "nat_gw-${var.env}-${terraform.workspace}"
  }

  depends_on = [aws_vpc.main, aws_eip.nat_eip]
}
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public_rt-${var.env}-${terraform.workspace}"
    env  = var.env
  }

  depends_on = [aws_vpc.main]
}#adds local route automatically  
resource "aws_route_table_association" "public_rt_association" {
  count          = length(var.public_subnet)
  subnet_id      = aws_subnet.public_subnet[count.index].id
  route_table_id = aws_route_table.public_rt.id


  depends_on = [aws_vpc.main, aws_subnet.public_subnet]
}#adds local route suppose 10.0.1.0/24 ,10.0.0.0/16-local-else 0.0.0.0/0 igw

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
  }

  tags = {
    Name = "private_rt-${var.env}-${terraform.workspace}"
    env  = var.env
  }

  depends_on = [aws_vpc.main]
}

resource "aws_route_table_association" "private_rt_association" {
  count          = length(var.private_subnet)
  subnet_id      = aws_subnet.private_subnet[count.index].id
  route_table_id = aws_route_table.private_rt.id


  depends_on = [aws_vpc.main, aws_subnet.private_subnet]
}
