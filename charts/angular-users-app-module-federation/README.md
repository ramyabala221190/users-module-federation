# How does Helm Charts work ?

A Helm chart is a structured directory containing everything needed to deploy an application on a Kubernetes cluster. It simplifies complex deployments by packaging multiple YAML configuration files (like Deployments, Services, ConfigMaps, etc.) into a single, coherent unit. 


The core components for deployment are:
1. templates/ directory: This is where the Kubernetes manifest files (deployment.yaml, service.yaml, etc.) are stored. These files are not static YAML but use Go templating language to define variable placeholders (e.g., {{ .Values.image.tag }}).

2. Chart.yaml file: This file contains metadata about the chart, such as its name, version, and API version.

3. values.yaml file: This file provides the default configuration values that are injected into the templates during deployment. 
The values.yaml file acts as the primary mechanism for customizing that deployment without modifying the underlying templates. 
The values.yaml file allows users to customize an application's configuration for different environments (e.g., development, staging, production) without altering the source templates. 

A typical values.yaml structure might look like this:

replicaCount: 1

image:
  repository: nginx
  tag: 1.21
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80


In the corresponding templates/deployment.yaml file, the replicaCount might be referenced as {{ .Values.replicaCount }} and the image tag as {{ .Values.image.tag }}. 

You can override the default values in values.yaml at deployment time using several methods: 
Command-line flags: 
Use the --set flag for specific values:
helm install my-release ./mychart --set replicaCount=3

External YAML files: Use the -f or --values flag to specify an environment-specific values file (e.g., production-values.yaml):

helm install my-release ./mychart -f production-values.yaml

Values provided this way take precedence over the defaults in the chart's values.yaml file. 

## values.yaml vs config.yaml

Great distinction to clarify — these two files serve **different purposes in Helm** 👇  

---

### 🔹 `values.yaml`
- **Purpose**: Provides **default configuration values** for your chart.  
- **Role**: Acts like a parameter file. You define variables here (image name, tag, replica count, environment, etc.).  
- **Usage**:  
  - Templates (`deployment.yaml`, `service.yaml`, `ingress.yaml`) reference these values using `{{ .Values.key }}`.  
  - You can override them at install/upgrade time with `-f custom-values.yaml` or `--set key=value`.  
- **Example**:
  ```yaml
  image:
    repository: myrepo/shell
    tag: "42"
  replicaCount: 3
  environment: prod
  ```

`config.yaml` (or `configmap.yaml`)
- **Purpose**: Defines a **Kubernetes ConfigMap resource**.  
- **Role**: Used to inject runtime configuration into Pods (not Helm chart parameters).  
- **Usage**:  
  - Stores non‑sensitive data like app settings, environment variables, or config files.  
  - Mounted into Pods as files or exposed as environment variables.  
- **Example**:
  ```yaml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: app-config
  data:
    APP_MODE: "production"
    LOG_LEVEL: "debug"
  ```

---

### ⚖️ Key Difference
- **`values.yaml`** → Helm chart parameters (controls how templates render).  
- **`config.yaml` / ConfigMap** → Kubernetes resource for application runtime configuration.  

Think of it like this:
- `values.yaml` = **chart input parameters** (build‑time for manifests).  
- `config.yaml` = **cluster resource** (runtime config for Pods).  

So the values.yaml contains parameters to be used in the files within the templates folder.
config.yaml exposes data as files mounted into Pods or as environment variables.  But either way, it needs to be declared
in the deployment.yaml for it to work.

In common-config.yaml,
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: common-users-app-config

data:
  nginxPort: "{{.Values.pod.containerPort}}"
  appName: "{{.Values.appName}}"
  
```
In deployment.yaml, we have redelared the name of env variable we want it to be exposed as, under name field, and where to find its value from.

```
 env:
           - name: nginxPort
             valueFrom:
               configMapKeyRef:
                  name: common-{{.Values.config.name}}
                  key: nginxPort
```

Same goes for volumes too.

# Helm package and upgrade commands

## helm package takes a chart directory (the folder containing your Helm chart) and packages it into a .tgz file.

That chart directory must contain:

1. Chart.yaml (chart metadata)

2. values.yaml (default values)

3. templates/ (YAML templates for Deployments, Services, Ingress, ConfigMaps, etc.)

So in this example, we have everything inside the angular-users-app-module-federation folder.

## What helm upgrade Does
helm upgrade updates an existing release with a new version of your chart or new values.

Instead of reinstalling from scratch, Helm compares the old manifest with the new one and applies changes.

It’s the standard way to roll out updates (new image tags, config changes, scaling, etc.) to your app.

helm upgrade <release-name> <chart-path-or-tgz> [flags]

- **`<release-name>`** → the name you gave when you first installed (e.g., `shell`, `remote-a`).  
- **`<chart-path-or-tgz>`** → path to your chart folder (`./charts/shell`) or packaged chart (`shell-1.0.0.tgz`).  
- **Flags**:
  - `--namespace frontend-dev` → target namespace.  
  - `-f values-dev.yaml` → override values for this upgrade.  
  - `--install` → if the release doesn’t exist, install it instead.  


✅ **Summary**:  
`helm upgrade` is how you evolve a running release — applying new chart versions or values without reinstalling. You always reference the **release name** you installed earlier, and you can override configs with values files or `--set`.  
---

### 🔹 Two Ways to Upgrade a Release
1. **Using the chart folder directly**  
   ```bash
   helm upgrade shell ./charts/shell -f values-prod.yaml --namespace frontend
   ```
   - You point to the chart directory (`./charts/shell`).  
   - Useful during development when you’re iterating quickly.  
   - No need to package every time.  

2. **Using the packaged `.tgz` file**  
   ```bash
   helm upgrade shell ./shell-1.1.0.tgz --namespace frontend
   ```
   - You point to the `.tgz` created by `helm package`.  
   - Useful when you want a **versioned, immutable artifact** (e.g., in CI/CD pipelines).  
   - Ensures you’re deploying the exact chart version that was built and stored.  

---

### 🔹 When to Use `.tgz`
- **Updating chart logic** (new templates, breaking changes, chart version bump).  
- **Promoting across environments** (dev → staging → prod) where you want the same packaged artifact.  
- **Publishing to a Helm repo** (Artifactory, GitHub Pages, Azure Container Registry, etc.).  
- **CI/CD pipelines** that require reproducibility and traceability.  

---

### 🔹 When to Use the Chart Folder
- **Local development** (quick testing).  
- **Minor value overrides** (replicas, image tag, config tweaks).  
- **No chart structure changes** — only app version or values change.  
  
✅ **Summary**:  
No, you don’t need `helm package` during local development. You can install/upgrade directly from the chart folder. Packaging is only needed when you want a distributable, versioned artifact for CI/CD or chart repositories.  

# Kubernetes namespace

A Kubernetes namespace is a virtual cluster within a single physical Kubernetes cluster, providing a mechanism to organize, isolate, and manage groups of related resources (like pods, services, and deployments). 
Namespaces are crucial in multi-tenant environments where many users, teams, or projects share a cluster, as they prevent naming conflicts and allow for granular access control and resource allocation.

# Kubernetes Nodes

A Node is a machine (physical server or virtual machine) that runs in your Kubernetes cluster.

Each node provides CPU, memory, storage, and networking resources.

Nodes run the Kubernetes agent (kubelet) and container runtime (like Docker or containerd).

In AKS, nodes are Azure VMs managed for you.

# Kubernetes Pods

- A **Pod** is the smallest deployable unit in Kubernetes.  
- It usually runs **one container** (like your Angular microfrontend image), but can run multiple tightly‑coupled containers.  
- Pods are ephemeral — they can be created, destroyed, or rescheduled at any time.

In Kubernetes, you don’t manually create multiple Pods.

Instead, you define a Deployment (or ReplicaSet) and specify the number of replicas.

Kubernetes then ensures that many identical Pods are running, each based on the same container image.

Yes — that’s exactly how Kubernetes achieves scalability and high availability.

### Relationship between nodes and pods

Nodes can host many Pods at once, depending on available resources.

Think of Nodes as machines and Pods as workloads running on those machines.

Example:

You have 3 nodes in your AKS cluster.

You deploy a Deployment with 6 replicas.

Kubernetes schedules those 6 Pods across the 3 nodes (maybe 2 Pods per node).

Node = apartment building (provides space, electricity, water).

Pod = apartment unit (where people live, sharing the building’s resources).

Multiple Pods can live in one Node, just like multiple apartments in one building.

# Kubernetes Service

- A **Service** is an abstraction that gives a stable network identity (DNS name + IP) to a set of Pods.  
- It groups Pods together using **labels**.  
- Even if Pods die and new ones are created, the Service endpoint stays the same.  
- Example:  
  ```
apiVersion: v1
kind: Service
metadata:
 name: {{.Values.services.name}}-{{.Values.environment}}  #service name
spec:
 type: {{.Values.services.type}}  #type of service
 selector:
    app: {{.Chart.Name}}-deployment-{{.Values.environment}} #selecting the pods
 ports: 
   - port: {{.Values.services.port}}
     targetPort: {{.Values.pod.containerPort}}

  ```
metadata.name is the unique name you have given to the service.
spec.type mentions the type of service. Here its ClusterIP because we dont want to expose it
outside the cluster.
spec.selector.app will specify the pods that this service is going to select and load balance the traffic
across.
spec.port specifies the port the service is listening on. Here it is 8081.
targetPort specifies the port of the docker container(running in the pod) to which the request needs to be forwarded to.

This Service selects all Pods with `{{.Chart.Name}}-deployment-{{.Values.environment}}`.  
Whether you have 1 Pod or 10 Pods, the Service load‑balances traffic across them.

### 🧩 Example: Multiple Pods Running the Same Container
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shell-deployment
spec:
  replicas: 3   # 👈 three Pods will be created
  selector:
    matchLabels:
      app: shell
  template:
    metadata:
      labels:
        app: shell
    spec:
      containers:
        - name: shell
          image: myrepo/shell:latest
          ports:
            - containerPort: 80
```

- This creates **3 Pods**, each running the same `myrepo/shell:latest` container.  
- If one Pod crashes, Kubernetes automatically replaces it to maintain the desired count. 

- **Pods** = actual running containers.  
- **Service** = stable entry point that groups Pods together.  

It means **one Service object** in Kubernetes sitting in front of **multiple Pods** running the same app
and load balances the traffic across them so clients don’t need to know about individual Pods.  
Multiple pods means multiple replicas of the same app.
For example, if your shell frontend Deployment has 3 replicas (3 Pods), the Service exposes them as **one logical endpoint**.


## Kubernetes Service types

ClusterIP, NodePort, LoadBalancer, and Ingress are Kubernetes service types for exposing applications, differing in accessibility and routing: 
ClusterIP (internal only), 
NodePort (static port on each node, good for dev), 
LoadBalancer (cloud provider LB for stable external IP), and 
Ingress (advanced L7 routing for multiple services, cost-effective, TLS). 
Use ClusterIP for microservices communication, NodePort for quick testing, LoadBalancer for simple external apps, and Ingress for complex production scenarios needing features like host/path routing. 

## ⚖️ LoadBalancer vs Ingress in Kubernetes

### 🔹 LoadBalancer Service
- **What it does**:  
  - Creates an external IP address and exposes a single Service (set of Pods) directly to the internet.  
  - In AKS, this automatically provisions an **Azure Load Balancer**.  
- **Use case**:  
  - Simple apps where you just need one public endpoint.  
  - Example: exposing a backend API or a single frontend app.  
- **Limitations**:  
  - Each Service of type `LoadBalancer` gets its own external IP.  
  - If you have multiple microfrontends, you’d end up with multiple public IPs — not ideal for a unified app experience.

---

### 🔹 Ingress (with Nginx or Azure Application Gateway)
- **What it does**:  
  - Provides a single external IP and routes traffic to multiple Services based on rules (hostnames, paths).  
  - Requires an **Ingress Controller** (like Nginx or Azure Application Gateway).  
- **Use case**:  
  - Complex apps with multiple microfrontends or APIs.  
  - Example:  
    - `https://app.example.com/` → shell frontend  
    - `https://app.example.com/api/` → backend service  
    - `https://app.example.com/micro1/` → microfrontend 1  
- **Advantages**:  
  - One external IP for the whole app.  
  - Centralized TLS/SSL termination.  
  - Easier routing and scaling.  

## 🧩 How It Applies to Your Microfrontends
- You have **1 shell container** (entry point) and **2 microfrontends** (internal).  
- Best practice:  
  - Expose **only the shell** via an **Ingress**.  
  - Keep the microfrontends as internal `ClusterIP` Services.  
  - The shell loads them internally using Kubernetes DNS (`http://remote-a-service/...`).  
- This way, users only see one public endpoint, and Kubernetes + Ingress handle the routing.


## ✅ Summary
- **LoadBalancer**: Direct, simple, one Service → one external IP.  
- **Ingress**: Smarter, centralized routing, one external IP → many Services.  
- For your case: **Ingress is the right choice** to expose only the shell while keeping remotes internal.  


## 🧩 Use Cases
1. **Expose a Single Application Publicly**
   - Example: You have a backend API (`api-service`) that needs to be reachable from outside the cluster.
   - A LoadBalancer Service gives it a dedicated external IP.

2. **Simple Frontend Deployment**
   - If you only have one frontend (not multiple microfrontends), you can expose it directly with a LoadBalancer Service.
   - Users connect via the public IP or a DNS name mapped to it.

3. **Testing / Quick Access**
   - For development or testing, a LoadBalancer Service is the fastest way to make a Pod reachable externally without setting up Ingress.

4. **Non‑HTTP Protocols**
   - Ingress controllers are usually HTTP/HTTPS focused.
   - If you need to expose other protocols (TCP, UDP), a LoadBalancer Service is often the right choice.
   - Example: exposing a database, gRPC service, or custom TCP app.



### ⚖️ When to Use vs Ingress
- **LoadBalancer**: Best for *one service → one external IP*. Simple, direct, protocol‑agnostic.
- **Ingress**: Best for *many services → one external IP*, with path/host routing and TLS termination.


What happens when i execute the below command:

```
helm install ingress-nginx-dev ingress-nginx/ingress-nginx --namespace ingress-nginx-dev --create-namespace --set controller.service.type=LoadBalancer --set controller.service.externalTrafficPolicy=Local --set controller.ingressClass=ingress-nginx-class-dev --set controller.ingressClassResource.name=ingress-nginx-class-dev --set controller.watchNamespace=dev-namespace --set controller.service.name=ingress-nginx-dev-controller --set controller.service.loadBalancerIP=20.253.59.201

```

The ingress-nginx/ingress-nginx Helm chart is designed to install the Ingress Controller (specifically NGINX Ingress Controller).
We created 2 ingess controllers for "dev" and "uat" using the above command with small differences.

Resources Created

1. Deployment:

This is the actual Kubernetes object that spins up the ingress controller pods (usually named something like ingress-nginx-controller).
Scaling the controller = scaling this Deployment.

2. Service (LoadBalancer):
Exposes the ingress controller pods externally.
In AKS, this triggers Azure to provision a cloud load balancer with the IP you specified (20.253.59.201).

So when you run `kubectl get svc -n ingress-nginx-dev`, you’ll see the Service objects in the ingress-nginx-dev namespace.

Among them will be the one you set up with Helm (e.g. ingress-nginx-dev-controller). That Service is of type LoadBalancer, and it’s the piece that:
=>Owns the external IP (in your case 20.253.59.201).
=>Connects to the Azure Load Balancer provisioned by AKS.
=>Selects the ingress controller pods (via labels like app=ingress-nginx) and forwards traffic to them.

So yes — the kubectl get svc output is showing you the Service that exposes the ingress controller pods. 

3. IngressClass & IngressClassResource:
Registers a custom ingress class (ingress-nginx-class-dev) so your Ingress manifests(i.e ingress-resource.yaml in the shell app) can explicitly target this controller i.e ingress-nginx-dev-controller

4. ConfigMaps, RBAC, etc.:
Supporting resources for configuration and permissions.

Flow
Azure Load Balancer (public IP 20.253.59.201) → forwards traffic to the Service in point 2. above.

Service → selects ingress controller pods.

Ingress controller pods → apply ingress rules to route traffic to your microfrontend services.

So the Helm chart creates a Deployment (pods), a Service (LoadBalancer), and supporting resources. The “controller” is implemented as that Deployment.


## Why NodePort service ?

NodePort service sits in front of your pods and opens a specific port (30000–32767) on every single node in your cluster. Any traffic hitting that port on any node is automatically routed to your pods.
```
apiVersion: v1
kind: Service
metadata:
  name: my-nodeport-service
spec:
  type: NodePort
  selector:
    app: my-app  # Must match the label on your Pods
  ports:
    - port: 80         # Internal cluster port
      targetPort: 8080 # Port your app listens on inside the pod
      nodePort: 30080  # Port to access from outside (optional, or auto-assigned)

```

Summary of the Traffic Flow When using a NodePort service, the traffic moves through these layers: 

External Client ----> hits nodePort (e.g., 30080) on a physical node ----> forwards to the Service's internal port (e.g., 80)----> routes to the Pod's targetPort (e.g., 8080)---> traffic reaches the application inside the container. 
 
NodePort opens a port on every single node in your cluster. If you have 100 nodes, you now have 100 entry points exposed to the internet

By default, NodePort is restricted to the range 30000–32767. Most users expect to access websites via port 80 (HTTP) or 443 (HTTPS). Asking a customer to visit http://example.com:30080 is unprofessional and often blocked by corporate firewalls.
Single Service per Port: You can only map one service to one specific port. This leads to "port management chaos" as you try to track which service uses which 30000+ number.

Unstable IPs: If a node is replaced or its IP changes (common in cloud environments with auto-scaling), you must manually update your external DNS records.

# Deployment vs Service

In Kubernetes, a Deployment is responsible for managing the lifecycle, state, and scaling of your application's Pods, while a Service provides a stable network endpoint and load balancing for those Pods. They are distinct but complementary components. 

A Deployment is created to run a specified number of application Pods. It ensures that if a Pod goes down, a new one is automatically created to maintain the desired state.

A Service is created with a selector that matches the labels of the Pods managed by the Deployment. This Service is assigned a stable IP address and acts as a consistent access point.

When other applications (or external users) need to communicate with your application, they talk to the Service's stable IP or DNS name. The Service then load-balances the network requests to one of the healthy, available Pods, regardless of which node the Pod is running on or its individual IP address. 

## Pod template

Great question — the **Pod template** is defined **inside a higher‑level controller** like a **Deployment**, **ReplicaSet**, **DaemonSet**, or **StatefulSet**. It’s not a standalone object in most cases — instead, it’s embedded in the spec of those controllers.  

---

### 🔹 Where the Pod Template Lives
In a **Deployment YAML**, you’ll see:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shell-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shell
  template:                # 👈 This is the Pod template
    metadata:
      labels:
        app: shell
    spec:
      containers:
        - name: shell
          image: myrepo/shell:latest
          ports:
            - containerPort: 80
```

- The `spec.template` block is the **Pod template**.  
- It describes **how Pods should look when created**:
  - Metadata (labels, annotations)  
  - Pod spec (containers, volumes, ports, environment variables, etc.)  

---

### 🔹 Why It’s Called a Template
- The Deployment doesn’t create one Pod and stop.  
- It uses the **Pod template** as a blueprint to create multiple Pods (replicas).  
- If you scale replicas from 3 → 10, Kubernetes just instantiates 10 Pods using that same template.  
- If you update the template (e.g., change the image tag), Kubernetes performs a rolling update, replacing old Pods with new ones based on the updated template.

---

### ✅ Summary
- The **Pod template** is defined inside the `spec.template` section of controllers like Deployments.  
- It’s the **blueprint** for Pods: labels, containers, ports, volumes, etc.  
- Controllers use this template to create, scale, and update Pods consistently.  


### 🔹 Why We Need `selector.matchLabels`
- A **Deployment** is a controller that manages Pods.  
- To know *which Pods it should manage*, the Deployment uses a **selector**.  
- The selector is defined in `spec.selector.matchLabels`.  
- This is how Kubernetes links the Deployment object to the Pods it owns.  

---

### 🔹 Pod Template vs Selector
- **Pod template (`spec.template`)**:  
  - Defines the **blueprint** for Pods the Deployment will create.  
  - Includes labels, container image, ports, etc.  
  - Example: Pods created with label `app: shell`.

- **Selector (`spec.selector.matchLabels`)**:  
  - Defines the **criteria** for which Pods the Deployment considers “mine.”  
  - Must match the labels in the Pod template.  
  - Example: `matchLabels: app: shell` → Deployment manages Pods labeled `app: shell`.

---

### 🧩 Why Both Are Needed
- Without the selector, Kubernetes wouldn’t know which Pods belong to the Deployment.  
- The Pod template alone just says “when you create Pods, give them these labels.”  
- The selector says “I will manage any Pods that have these labels.”  
- Together, they form the **link** between Deployment and Pods.

---

### ⚠️ What Happens If They Don’t Match
```yaml
selector:
  matchLabels:
    app: frontend
template:
  metadata:
    labels:
      app: backend
```
- Deployment creates Pods labeled `backend`.  
- But the selector is looking for `frontend`.  
- Result: Deployment doesn’t recognize its own Pods → no scaling, no rolling updates.  

---

✅ **Summary**:  
- `selector.matchLabels` = tells the Deployment which Pods it owns.  
- `template.metadata.labels` = defines the labels applied to Pods it creates.  
- They must match to establish ownership.  


### 🔹 Can a Deployment Have Multiple Pod Templates?
- **No** — a single Deployment has **one Pod template** (`spec.template`).  
- That template is the **blueprint** for all Pods created by the Deployment.  
- If you want different Pod templates (e.g., different containers, labels, configs), you need **multiple Deployments**.  

---

### 🔹 Why We Still Need a Selector
Even though a Deployment only has one Pod template, the **selector** is still required because:
- It defines **which Pods the Deployment considers its own**.  
- Kubernetes uses this to match Pods in the cluster to the Deployment.  
- This ensures rolling updates, scaling, and self‑healing only apply to the correct Pods.  

---

### 🧩 Example
```yaml
spec:
  selector:
    matchLabels:
      app: shell
  template:
    metadata:
      labels:
        app: shell
```

- The Deployment creates Pods with label `app: shell`.  
- The selector says: “I manage Pods with label `app: shell`.”  
- This link is what allows the Deployment to know which Pods to update or scale.  

---

### 🔑 Why It Matters
- Without the selector, the Deployment wouldn’t know which Pods it owns.  
- If you accidentally mismatch labels, the Deployment won’t manage the Pods it creates.  
- This is why Kubernetes requires both:  
  - **Template labels** → what Pods get stamped with.  
  - **Selector** → what Pods the Deployment manages.

---

✅ **Summary**:  
- A Deployment has **only one Pod template**.  
- The selector is required not because there are multiple templates, but because Kubernetes needs an explicit way to link the Deployment to the Pods it manages.  



🧩 Step‑by‑Step Flow

1. **Deployment (Pod template defined here)**  
   - The Deployment contains the `spec.template` block.  
   - That template defines **Pod labels** and the **container spec**.  
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: shell-deployment
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: shell
     template:                # 👈 Pod template
       metadata:
         labels:
           app: shell         # 👈 Pod label
       spec:
         containers:
           - name: shell
             image: myrepo/shell:latest
             ports:
               - containerPort: 80
   ```

   ➡️ Result: 3 Pods are created, each labeled `app: shell`.

---

2. **Service (selector matches Pod labels)**  
   - The Service uses a selector to find Pods with `app: shell`.  
   - It load‑balances traffic across those Pods.  
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: shell-service
   spec:
     selector:
       app: shell             # 👈 must match Pod labels
     ports:
       - port: 80
         targetPort: 80
   ```

   ➡️ Result: `shell-service` forwards traffic to all Pods labeled `app: shell`.

---

3. **Ingress (routes external traffic to Service)**  
   - The Ingress defines rules for external access.  
   - It points to the Service, not directly to Pods.  
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: shell-ingress
     annotations:
       kubernetes.io/ingress.class: nginx
   spec:
     rules:
       - host: app.example.com
         http:
           paths:
             - path: /
               pathType: Prefix
               backend:
                 service:
                   name: shell-service   # 👈 points to Service
                   port:
                     number: 80
   ```

   ➡️ Result: Requests to `https://app.example.com/` are routed to `shell-service`, which then load‑balances across the Pods.

---

### 🔑 Key Takeaway
- **Pod template** defines Pod labels.  
- **Service selector** matches those labels to group Pods.  
- **Ingress** points to the Service, not Pods directly.  
- This chain ensures stable routing even if Pods are rescheduled or replaced.


### 🔹 Multiple Git Repos, One Cluster Namespace
- Each **microfrontend** (like `remoteA`, `remoteB`, and the shell) can live in its **own Git repo** with its own Helm chart or Kubernetes manifests.  
- On deployment, you target the **same Kubernetes namespace** (e.g., `frontend`) so that:  
  - All Services are discoverable by name (`remote-a-service`, `remote-b-service`, `shell-service`).  
  - The Ingress can route traffic to them consistently.  
  - They share the same DNS scope (`<service>.<namespace>.svc.cluster.local`).  

---

### 🔹 Why Same Namespace Matters
- **Service discovery**: Ingress rules reference Services by name. If they’re in different namespaces, you’d need cross‑namespace routing (which is messy).  
- **Isolation vs cohesion**:  
  - If these microfrontends are part of one logical app, keeping them in the same namespace makes sense.  
  - If they were unrelated apps, you’d isolate them in different namespaces.  
- **Config consistency**: Shared ConfigMaps, Secrets, and Ingress resources work seamlessly when everything is in one namespace.  

---

### 🧩 Example Workflow
1. **Repo A (remoteA)** → contains Deployment + Service for Remote A.  
   ```bash
   helm upgrade remote-a ./chart --namespace frontend
   ```
2. **Repo B (remoteB)** → contains Deployment + Service for Remote B.  
   ```bash
   helm upgrade remote-b ./chart --namespace frontend
   ```
3. **Repo Shell** → contains Deployment + Service + Ingress.  
   ```bash
   helm upgrade shell ./chart --namespace frontend
   ```

➡️ Result: All Pods (from different repos) run in the same namespace, Services are discoverable, and Ingress can route traffic correctly.

---

### ✅ Summary
Yes — even if the Pod templates (Deployments) live in different Git repos, they should be deployed into the **same namespace** in the cluster so that Services and Ingress can stitch them together into one application.  


## Common Approaches for handling multiple environments

### 1. **Separate Namespaces per Environment**
- Deploy each environment into its own namespace (`frontend-dev`, `frontend-staging`, `frontend-prod`).  
- Keeps resources isolated but still within the same cluster.  
- Example:
  ```bash
  helm upgrade remote-a ./chart --namespace frontend-dev
  helm upgrade remote-a ./chart --namespace frontend-prod
  ```

### 2. **Separate Clusters per Environment**
- Dev/staging on one cluster, prod on another.  
- Stronger isolation, but more infra overhead.  
- Often used when prod requires stricter security or scaling guarantees.

### 3. **Parameterized Helm Values**
- Use `values.yaml` overrides for each environment.  
- Example:
  - `values-dev.yaml` → smaller replica count, debug logging, dev image tags.  
  - `values-prod.yaml` → larger replica count, optimized configs, prod image tags.  
- Deploy with:
  ```bash
  helm upgrade shell ./chart -f values-dev.yaml --namespace frontend-dev
  helm upgrade shell ./chart -f values-prod.yaml --namespace frontend-prod
  ```

### 4. **CI/CD Pipelines**
- Your pipeline decides which environment to deploy to.  
- Example:  
  - Push to `main` → deploy to staging.  
  - Tag a release → deploy to prod.  
- Each pipeline run passes the correct `values.yaml` file or `--set environment=prod`.

---

### 🔹 How This Fits Your Microfrontend Setup
- Each microfrontend (remoteA, remoteB, shell) lives in its own repo.  
- On deployment, you target the **same namespace per environment** so Ingress can stitch them together.  
- Example structure:
  - `frontend-dev` namespace → all dev versions of shell + remotes.  
  - `frontend-prod` namespace → all prod versions.  
- Ingress hostnames can be parameterized:
  - Dev → `dev.app.example.com`  
  - Prod → `app.example.com`

---

### ✅ Summary
You handle multiple environments by combining:
- **Namespaces or clusters** for isolation.  
- **Helm values files** for environment‑specific configs.  
- **CI/CD pipelines** to automate which environment gets deployed. 


# VolumeMounts

### 🔹 Context
This snippet is from a **Pod spec template** in Helm (`deployment.yaml` most likely). It defines **volume mounts** inside a container. Helm templates are parameterized with values from `values.yaml`.

### 🔹 What Each Field Means
```yaml
volumeMounts:
  - name: {{ .Values.config.volume }}
    mountPath: /{{ .Values.config.mountPath }}
    readOnly: true
  - name: common-{{ .Values.config.volume }}
    mountPath: /{{ .Values.config.mountPath }}
    readOnly: true
```

- **`volumeMounts`** → tells Kubernetes to mount a volume into the container’s filesystem.  
- **`name`** → must match a `volume` defined elsewhere in the Pod spec.  
  - Here it’s parameterized: `{{ .Values.config.volume }}` (from `values.yaml`).  
  - Example: if `config.volume: app-config`, then the volume name is `app-config`.  
  - The second mount uses `common-{{ .Values.config.volume }}`, so if `app-config`, it becomes `common-app-config`.  
- **`mountPath`** → the path inside the container where the volume will be mounted.  
  - Example: if `config.mountPath: config`, then the mount path is `/config`.  
- **`readOnly: true`** → ensures the container cannot modify the mounted files.  


# Commands:

1. kubectl get pods
This gets the pod in the current checkedout namespace

2. kubectl logs <pod-name> -n <namespace-name>

3. shell into pod container

kubectl exec -it pod/angular-shell-app-module-federation-deployment-dev-76d454bwksq6 -n dev-namespace -- /bin/sh

4. list the env variables available to the container running in the pod. After shelling into
the container, type env and then enter to get the list.

C:\Users\User>kubectl exec -it pod/angular-shell-app-module-federation-deployment-dev-67dd8cfl6hd7 -n dev-namespace -- /bin/sh
/ # env

6. kubectl get namespaces
This lists out all namespaces

7. kubectl get pods --all-namespaces
This lists out the pods in all namespaces.



