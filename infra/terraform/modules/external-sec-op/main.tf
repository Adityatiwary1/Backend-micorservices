resource "helm_release" "external_secrets" {
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  version          = "2.7.0"

  namespace        = var.namespace
  create_namespace = false

  set = [
    {
      name  = "serviceAccount.create"
      value = "false"
    },
    {
      name  = "serviceAccount.name"
      value = var.name
    }
  ]
}
resource "kubernetes_manifest" "cluster_secret_store" {
  manifest = {
    apiVersion = "external-secrets.io/v1"
    kind       = "ClusterSecretStore"

    metadata = {
      name = "cluster-secret-store"
    }

    spec = {
      provider = {
        aws = {
          service = "SecretsManager"

          region = var.aws_secret_region

          auth = {
            jwt = {
              serviceAccountRef = {
                name      = var.name
                namespace = var.namespace
              }
            }
          }
        }
      }
    }
  }
  depends_on = [ helm_release.external_secrets ]
}