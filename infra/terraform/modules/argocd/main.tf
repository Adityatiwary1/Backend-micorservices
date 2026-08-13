
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
#alb controller is also running if ingresses are updated or new ingresses then alb controller will update the target group automatically of lb 
#alb controller runs as pods in worker nodes has service account (RBAC) to talk to control plane and check ingresses of all anemspaces at intervals It hass these RBAC permissions