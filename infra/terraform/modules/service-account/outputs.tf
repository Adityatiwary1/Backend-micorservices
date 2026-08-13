output "kubernetes_service_account" {
  value=kubernetes_service_account.external-secrets-sa.metadata[0].name
}
output "namespace" {
  value=kubernetes_namespace.external_secrets.metadata[0].name
}