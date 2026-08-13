resource "kubernetes_storage_class_v1" "app" {
  metadata {
    name = "cloud-store-ebs"
  }

  storage_provisioner = var.addon_ebsname

  parameters = {
    type      = "gp3"
    encrypted = "true"
  }

  reclaim_policy      = "Delete"
  volume_binding_mode = "WaitForFirstConsumer"

  allow_volume_expansion = true
}