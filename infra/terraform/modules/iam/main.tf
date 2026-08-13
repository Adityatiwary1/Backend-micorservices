locals {
  cluster_name = var.cluster_name
}

resource "random_integer" "random_suffix" {
  min = 1254
  max = 9999
}

resource "aws_iam_role" "eks-cluster-role" {
  name  = "${local.cluster_name}-role-${random_integer.random_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}
resource "aws_iam_role_policy_attachment" "AmazonEKSClusterPolicy" {
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks-cluster-role.name
}

data "aws_iam_policy_document" "eks_oidc_assume_trust_policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(var.oidc_provider_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:external-secrets:external-secrets"]
    }
    condition {
      test = "StringEquals"

      variable = "${replace(var.oidc_provider_url, "https://", "")}:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }   

    principals {
      identifiers = [var.oidc_provider_arn]
      type        = "Federated"
    }
  }
}
data "aws_iam_policy_document" "eks_oidc_assume_trust_policy_cni" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(var.oidc_provider_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-node"]
    }
    condition {
      test = "StringEquals"

      variable = "${replace(var.oidc_provider_url, "https://", "")}:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }   

    principals {
      identifiers = [var.oidc_provider_arn]
      type        = "Federated"
    }
  }
}
data "aws_iam_policy_document" "eks_oidc_assume_trust_policy_ebs" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(var.oidc_provider_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
    }
    condition {
      test = "StringEquals"

      variable = "${replace(var.oidc_provider_url, "https://", "")}:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }   

    principals {
      identifiers = [var.oidc_provider_arn]
      type        = "Federated"
    }
  }
}
data "aws_iam_policy_document" "external_secrets_permissions" {
  statement {
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = [
      "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:*"
    ]
  }
}
resource "aws_iam_role" "eks-nodegroup-role" {
 
  name  = "${local.cluster_name}-nodegroup-role-${random_integer.random_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}
resource "aws_iam_role_policy_attachment" "eks-AmazonEC2ContainerRegistryReadOnly" {
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks-nodegroup-role.name
}
resource "aws_iam_role_policy_attachment" "eks-AmazonWorkerNodePolicy" {
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks-nodegroup-role.name
}
resource "aws_iam_role" "external_secrets" {
  name = "external-secrets"

  # Trust policy
  assume_role_policy = data.aws_iam_policy_document.eks_oidc_assume_trust_policy.json
}
resource "aws_iam_role" "ebs-driver-role" {
  name = "ebs-role"

  # Trust policy
  assume_role_policy = data.aws_iam_policy_document.eks_oidc_assume_trust_policy_ebs.json
}
resource "aws_iam_role" "vps-cni-role" {
  name = "vpc-cni-role"

  # Trust policy
  assume_role_policy = data.aws_iam_policy_document.eks_oidc_assume_trust_policy_cni.json
}
resource "aws_iam_role_policy_attachment" "eks-AmazonEBSCSIDriverPolicy" {
  
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs-driver-role.name
}
resource "aws_iam_role_policy_attachment" "eks-AmazonEKS_CNI_Policy" {
  
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.vps-cni-role.name
}
resource "aws_iam_role_policy" "external_secrets" {
  name   = "external-secrets-secretsmanager"
  role   = aws_iam_role.external_secrets.name
  policy = data.aws_iam_policy_document.external_secrets_permissions.json
}