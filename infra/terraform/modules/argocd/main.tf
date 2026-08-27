#public repo no cred github for clone for argocd
resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = "9.3.1"
  namespace        = "argocd"
  create_namespace = true

  cleanup_on_fail = true
  recreate_pods   = true
  replace         = true

  set=[ {
    name  = "server.service.type"
    value = "ClusterIP"
  }

  , {
    name  = "server.ingress.enabled"
    value = "false"
  }

  ,{
    name  = "server.extraArgs[0]"
    value = "--insecure"
  }

  ,{
    name  = "crds.keep"
    value = "false"
  }]

 
}

resource "kubernetes_ingress_v1" "argocd" {
  metadata {
    name      = "argocd"
    namespace = "argocd"

    annotations = {
      "kubernetes.io/ingress.class"                  = "alb"
      "alb.ingress.kubernetes.io/scheme"             = "internet-facing"
      "alb.ingress.kubernetes.io/target-type"        = "ip"
      "alb.ingress.kubernetes.io/backend-protocol"   = "HTTP"
      "alb.ingress.kubernetes.io/listen-ports"       =  "[{\"HTTP\":80},{\"HTTPS\":443}]"
      "alb.ingress.kubernetes.io/group.name"         = "backendmicro"
      #"alb.ingress.kubernetes.io/ssl-redirect"       = "443"
      #"alb.ingress.kubernetes.io/certificate-arn"    = var.acm_certificate_arn
    }
  }

  spec {
    rule {
      host = "argocd.example.com"

      http {
        path {
          path      = "/"
          path_type = "Prefix"

          backend {
            service {
              name = "argocd-server"

              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [
    helm_release.argocd,
  
  ]
}
locals {
  ecr_registry_half_arn = "${var.aws_account_id}.dkr.ecr.${var.aws_ecrimage_region}.amazonaws.com/${var.reponame}"
}
resource "kubernetes_manifest" "microservices" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"

    metadata = {
      name      = "microservices"
      namespace = "argocd"

      annotations = {
           "argocd-image-updater.argoproj.io/image-list" = <<-EOT
                user=${local.ecr_registry_half_arn}/user-service,
                search=${local.ecr_registry_half_arn}/search-service,
                post=${local.ecr_registry_half_arn}/post-service,
                media=${local.ecr_registry_half_arn}/media-service,
                mcpclient=${local.ecr_registry_half_arn}/mcpclient-service,
                mcpserver=${local.ecr_registry_half_arn}/mcpserver-service,
                rabbitmq=${local.ecr_registry_half_arn}/rabbitmq-service,
                redis=${local.ecr_registry_half_arn}/redis-service,
                nginxgateway=${local.ecr_registry_half_arn}/nginx-service
                
              EOT
#<< multilinestring delimiter(EOF) where multilinestring ends of tf not yml syntax(|)
         "argocd-image-updater.argoproj.io/write-back-method"="git:secret:argocd/argocd-image-updater-github"
       # "argocd-image-updater.argoproj.io/write-back-method" = "git"
          "argocd-image-updater.argoproj.io/myapp.update-strategy"="semver"
          "argocd-image-updater.argoproj.io/write-back-target" = "kustomization"
      }
    }

    spec = {
      project = "default"

      source = {
        repoURL        = "https://github.com/Adityatiwary1/Backend-micorservices.git"
        targetRevision = "main"
        path           = "k8s"
      }

      destination = {
        server    = "https://kubernetes.default.svc"
        namespace = "microservices"
      }

      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
        syncOptions = [
          "CreateNamespace=false"
          
        ]
      }
    }
  }
  depends_on = [
    helm_release.argocd,kubernetes_secret.argocd_image_updater_github
  ]
}
/*
resource "kubernetes_manifest" "argocd_app" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"

    metadata = {
      name      = "argocd_app"
      namespace = "argocd"
    }

    spec = {
      project = "default"

      source = {
        repoURL        = "https://github.com/Adityatiwary1/Backend-micorservices.git"
        targetRevision = "main"
        path           = "k8s"
      }

      destination = {
        server    = "https://kubernetes.default.svc"  # we can directly reach eks amazon service of our region ahs eks has attched itselft to our vpc an interface has vpc ip
                                                       # so argo cd cna send api kubenetes request directly not aws type to vpc ip no need to go through natgateway and make req to kubenertes control plane of cluster public ip
                                                       #the ip exposed is pf the kubernetes control plane endpont of the cluster  not aws eks service regional endpoint
                                                       #2 levels of endpoint one in terraform aws eks sevrice and now one nedpoint of the created cluster through eks regionl endpoint  contorl plane of cluster which is kubenretes api endpoint 
                                                       # soa rgocd only needs cli of kubernets not aws sdk client
        namespace = "backendmicro"
      }

      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
#target  namespace where the resources will be deployment or updated
        syncOptions = [
          "CreateNamespace=false"
          
        ]
      }
    }
  }

  depends_on = [
    helm_release.argocd
  ]
}
*/
#alb controller is also running if ingresses are updated or new ingresses then alb controller will update the target group automatically of lb 
#alb controller runs as pods in worker nodes has service account (RBAC) to talk to control plane and check ingresses of all anemspaces at intervals It hass these RBAC permissions
resource "kubernetes_secret" "argocd_image_updater_github" {
  metadata {
    name      = "argocd-image-updater-github"
    namespace = "argocd"
  }

  type = "Opaque"

  data = {
    username = base64encode(var.github_username)
    password = base64encode(var.github_token)
  }
  depends_on = [helm_release.argocd  ]
}
resource "kubernetes_service_account" "image-updater-sa" {
  metadata {
    name      = "image-updater-secrets"
    namespace = "argocd"
    annotations = {
      "eks.amazonaws.com/role-arn" =  var.ecr_role_arn
    }
  }
 depends_on = [ helm_release.argocd ]
}
resource "helm_release" "argocd_image_updater" {
  name       = "argocd-image-updater"
  namespace  = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-image-updater"
  version = "0.9.0"  #latest version wants gitcred in spec of app
  depends_on = [
    helm_release.argocd,
    kubernetes_secret.argocd_image_updater_github,
    kubernetes_manifest.microservices,
    kubernetes_service_account.image-updater-sa
  ]

  set=[ {
    name  = "serviceAccount.create"
    value = "false"
  },

  {
    name  = "serviceAccount.name"
    value = kubernetes_service_account.image-updater-sa.metadata[0].name
  }]
  
}

