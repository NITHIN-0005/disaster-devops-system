terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "disaster_app" {
  name = "disaster-app:latest"
}

resource "docker_container" "backend" {
  name  = "disaster-backend"
  image = docker_image.disaster_app.name

  ports {
    internal = 3000
    external = 3000
  }
}