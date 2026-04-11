/* GitHub Globe - 3D Interactive Globe Visualization
   Compatible with Three.js library
*/

(function(global) {
  'use strict';

  class GithubGlobe {
    constructor(containerElement, config = {}, data = []) {
      this.container = containerElement;
      this.config = {
        pointSize: 1,
        globeColor: '#1d072e',
        showAtmosphere: true,
        atmosphereColor: '#ffffff',
        atmosphereAltitude: 0.1,
        emissive: '#000000',
        emissiveIntensity: 0.1,
        shininess: 0.9,
        polygonColor: 'rgba(255,255,255,0.7)',
        arcTime: 2000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        initialPosition: { lat: 0, lng: 0 },
        autoRotate: false,
        autoRotateSpeed: 0.8,
        showContinents: false,
        ...config,
      };

      this.data = data;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.globe = null;
      this.animationId = null;
      this.arcs = [];
      this.points = [];

      this.init();
    }

    init() {
      // Scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xffffff);

      // Camera setup
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.camera.position.z = 2.5;

      // Renderer setup
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.container.appendChild(this.renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 3, 5);
      this.scene.add(directionalLight);

      // Create globe
      this.createGlobe();

      // Create atmosphere
      if (this.config.showAtmosphere) {
        this.createAtmosphere();
      }

      // Add data points and arcs
      this.addData();

      // Handle resize
      window.addEventListener('resize', () => this.onWindowResize());

      // Start animation loop
      this.animate();
    }

    createGlobe() {
      const geometry = new THREE.SphereGeometry(1, 64, 64);
      
      // Create material with texture if continents should be shown
      let material;
      
      if (this.config.showContinents) {
        // Use a canvas-based texture to show continents
        const canvas = this.createContinentTexture();
        const texture = new THREE.CanvasTexture(canvas);
        material = new THREE.MeshPhongMaterial({
          map: texture,
          emissive: this.config.emissive,
          emissiveIntensity: this.config.emissiveIntensity,
          shininess: this.config.shininess,
          wireframe: false,
        });
      } else {
        // Fallback to solid color
        material = new THREE.MeshPhongMaterial({
          color: this.config.globeColor,
          emissive: this.config.emissive,
          emissiveIntensity: this.config.emissiveIntensity,
          shininess: this.config.shininess,
          wireframe: false,
        });
      }

      this.globe = new THREE.Mesh(geometry, material);
      this.scene.add(this.globe);
    }

    createContinentTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Base ocean color
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw continents with a simple landmass pattern
      ctx.fillStyle = '#1a3a52';
      
      // North America
      ctx.beginPath();
      ctx.ellipse(200, 350, 120, 180, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // South America
      ctx.beginPath();
      ctx.ellipse(280, 550, 80, 140, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Europe & Africa
      ctx.beginPath();
      ctx.ellipse(900, 300, 100, 200, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Africa
      ctx.beginPath();
      ctx.ellipse(1000, 550, 120, 180, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Asia
      ctx.beginPath();
      ctx.ellipse(1300, 400, 250, 220, 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Australia
      ctx.beginPath();
      ctx.ellipse(1500, 700, 90, 100, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Add some mountain/terrain detail
      ctx.fillStyle = '#2a4a62';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 30 + 10;
        ctx.fillRect(x, y, size, size * 0.5);
      }

      // Add subtle grid lines for latitude/longitude
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Latitude lines
      for (let i = 0; i <= 10; i++) {
        const y = (canvas.height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Longitude lines
      for (let i = 0; i <= 20; i++) {
        const x = (canvas.width / 20) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      return canvas;
    }

    createAtmosphere() {
      const atmosphereGeometry = new THREE.SphereGeometry(
        1 + this.config.atmosphereAltitude,
        64,
        64
      );
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: this.config.atmosphereColor,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
      });

      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      this.scene.add(atmosphere);
    }

    latLngToCartesian(lat, lng, radius = 1) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      return new THREE.Vector3(x, y, z);
    }

    addData() {
      this.data.forEach((item) => {
        if (item.startLat !== undefined && item.startLng !== undefined) {
          // It's an arc
          this.createArc(item);
        } else if (item.lat !== undefined && item.lng !== undefined) {
          // It's a point
          this.createPoint(item);
        }
      });
    }

    createArc(arcData) {
      const startPoint = this.latLngToCartesian(
        arcData.startLat,
        arcData.startLng
      );
      const endPoint = this.latLngToCartesian(arcData.endLat, arcData.endLng);

      const points = [];
      const altitude = arcData.arcAlt || 0.2;
      const arcLength = this.config.arcLength;

      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const point = new THREE.Vector3().lerpVectors(startPoint, endPoint, t);
        point.normalize();

        const height =
          Math.sin(t * Math.PI) * altitude * (1 - Math.abs(point.length() - 1));
        point.multiplyScalar(1 + height);

        points.push(point);
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(arcData.color || '#ff0000'),
        linewidth: 2,
      });

      const arc = new THREE.Line(geometry, material);
      this.scene.add(arc);

      // Animate arc
      this.animateArc(arc, arcData.arcTime || this.config.arcTime);

      this.arcs.push(arc);
    }

    animateArc(arc, duration) {
      const startTime = Date.now();
      const initialOpacity = arc.material.opacity || 1;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % duration) / duration;

        if (progress < 0.5) {
          arc.material.opacity = initialOpacity * (progress / 0.5);
        } else {
          arc.material.opacity = initialOpacity * ((1 - progress) / 0.5);
        }

        if (elapsed < duration * 2) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }

    createPoint(pointData) {
      const position = this.latLngToCartesian(pointData.lat, pointData.lng);

      // Main point
      const geometry = new THREE.SphereGeometry(
        this.config.pointSize * 0.05,
        16,
        16
      );
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(pointData.color || '#00ff00'),
      });

      const point = new THREE.Mesh(geometry, material);
      point.position.copy(position);
      this.scene.add(point);

      // Rings animation
      this.createRings(position, pointData.color || '#00ff00');

      this.points.push(point);
    }

    createRings(position, color) {
      for (let i = 1; i <= this.config.rings; i++) {
        const geometry = new THREE.TorusGeometry(
          this.config.pointSize * 0.1 * i,
          0.01,
          16,
          32
        );
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.6,
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;

        this.scene.add(ring);

        // Animate ring
        this.animateRing(ring, i);
      }
    }

    animateRing(ring, index) {
      const speed = 0.001 * (1 / index);
      const maxScale = 1 + this.config.maxRings * 0.1;

      const animate = () => {
        ring.rotation.x += speed;
        ring.rotation.y += speed;

        const scale =
          1 + Math.sin(Date.now() * 0.001 + index) * 0.1 * this.config.maxRings;
        ring.scale.set(scale, scale, scale);

        this.animationId = requestAnimationFrame(animate);
      };

      animate();
    }

    animate = () => {
      this.animationId = requestAnimationFrame(this.animate);

      // Auto-rotate
      if (this.config.autoRotate) {
        this.globe.rotation.y += this.config.autoRotateSpeed * 0.001;
      }

      // Update all rings
      const now = Date.now();
      this.arcs.forEach((arc) => {
        arc.rotation.copy(this.globe.rotation);
      });

      this.renderer.render(this.scene, this.camera);
    };

    onWindowResize() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    rotate(lat, lng) {
      const target = this.latLngToCartesian(lat, lng);
      // Implement smooth rotation to point
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      if (this.renderer && this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.scene = null;
      this.camera = null;
      this.renderer = null;
    }
  }

  // Export for use in global scope
  global.GithubGlobe = GithubGlobe;
})(window);
