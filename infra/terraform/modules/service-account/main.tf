
resource "kubernetes_namespace" "external_secrets" {
  metadata {
    name = "external-secrets"
  }
}
resource "kubernetes_service_account" "external-secrets-sa" {
  metadata {
    name      = "external-secrets"
    namespace = kubernetes_namespace.external_secrets.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" =  var.external_role_arn
    }
  }
 depends_on = [ kubernetes_namespace.external_secrets ]
}

