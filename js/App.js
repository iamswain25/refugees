var app = new Vue({
  el: "#app",
  data: () => ({
    toggleCity: false,
    toggleAgency: false,
    toggleNgo: false,
    width: window.innerWidth - 30,
    height: window.innerHeight - 100,
    id_name_map: {},
    cities: [],
    agencies: [],
    ngo: [],
    active: d3.select(null),
    path: null,
    tooltip: null,
    cityActive: null
  }),
  created() {
    console.time("created");
    this.svg = d3.select("svg");
    this.getMapNamesForId();
    window.addEventListener("resize", this.updateWindowDimensions);
    console.timeEnd("created");
  },
  methods: {
    updateWindowDimensions() {
      this.width = window.innerWidth - 30;
      this.height = window.innerHeight - 100;
    },
    async getMapNamesForId() {
      console.time("getMapNamesForId");
      try {
        const name_id_map = {};
        await d3.tsv("js/us-state-names.tsv", (obj, index) => {
          name_id_map[obj.name] = obj;
          this.id_name_map[obj.id] = obj;
        });
        await d3.csv("refined_data/cities_sum_geocode.csv", (obj, index) => {
          this.cities.push(obj);
        });
        await d3.csv("refined_data/states_sum.csv", (obj, index) => {
          Object.assign(name_id_map[obj.state], obj);
        });
        await d3.csv("refined_data/agencies.csv", (obj, index) => {
          this.agencies.push(obj);
        });
        await d3.csv("refined_data/ngo.csv", (obj, index) => {
          this.ngo.push(obj);
        });
      } catch (error) {
        console.log(error);
      }
      this.draw();
      console.timeEnd("getMapNamesForId");

      return;
    },
    draw() {
      console.time("draw");
      const width = this.width;
      const height = this.height;
      var projection = d3
        .geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
      const path = d3.geoPath().projection(projection);
      this.path = path;
      this.tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("fill-opacity", 0);
      d3.select("g.states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "feature")
        .attr("style", d => {
          var opa = this.id_name_map[d.id].sum / 106605;
          opa = Math.round(opa * 100) / 100;
          return `fill-opacity: ${opa};`;
        })
        .on("click", this.clicked);

      d3.select("g.counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "countiesFeature");
      d3.select("g.cities")
        .selectAll("circle")
        .data(this.cities)
        .enter()
        .append("circle", ".city")
        .attr("cx", d =>
          projection([d.lng, d.lat]) ? projection([d.lng, d.lat])[0] : 0
        )
        .attr("cy", d =>
          projection([d.lng, d.lat]) ? projection([d.lng, d.lat])[1] : 0
        )
        .attr("r", d => (d.sum > 9 ? Math.sqrt(d.sum) / 10 : 0.3))
        .attr("fill", "green")
        .attr("cursor", "pointer")
        .attr("fill-opacity", 0.2)
        .on("click", (d, id, arr) => {
          this.cityActive ? (this.cityActive.style.fill = "green") : null;
          this.cityActive = arr[id];
          this.cityActive.style.fill = "red";
          this.tooltip
            .html(`${d.city}: ${d.sum}`)
            .transition()
            .style("opacity", 0.9)
            .style("left", d3.event.pageX - 100 + "px")
            .style("top", d3.event.pageY - 80 + "px");
        });
      d3.select("g.agencies")
        .selectAll("circle")
        .data(this.agencies)
        .enter()
        .append("circle", ".agency")
        .attr("cx", d =>
          projection([d.lng, d.lat]) ? projection([d.lng, d.lat])[0] : 0
        )
        .attr("cy", d =>
          projection([d.lng, d.lat]) ? projection([d.lng, d.lat])[1] : 0
        )
        .attr("r", 1.5)
        .attr("fill", "purple")
        .attr("cursor", "pointer")
        .attr("fill-opacity", 0.9)
        .on("click", (d, id, arr) => {
          this.tooltip
            .html(`<span class="agencies">Agency</span> ${d.agency}: ${d.address}`)
            .transition()
            .style("opacity", 0.9)
            .style("left", d3.event.pageX - 100 + "px")
            .style("top", d3.event.pageY - 80 + "px");
        });
      d3.select("g.ngo")
        .selectAll("circle")
        .data(this.ngo)
        .enter()
        .append("circle", ".agency")
        .attr("cx", d =>
          projection([d.lng, d.lat]) ? projection([d.lng, d.lat])[0] : 0
        )
        .attr("cy", d =>
          projection([d.lng, d.lat]) ? projection([d.lng, d.lat])[1] : 0
        )
        .attr("r", 1.5)
        .attr("fill", "red")
        .attr("cursor", "pointer")
        .attr("fill-opacity", 0.9)
        .on("click", (d, id, arr) => {
          console.log(d);
          const link =
            d.website.length > 0 ? `<a href="${d.website}">link</a>` : "";
          this.tooltip
            .html(`<span class="ngo">NGO</span> ${d.name}: ${link}`)
            .transition()
            .style("opacity", 0.9)
            .style("left", d3.event.pageX - 100 + "px")
            .style("top", d3.event.pageY - 80 + "px");
        });
      console.timeEnd("draw");
    },
    reset() {
      this.toggleCity = false;
      this.toggleAgency = false;
      this.toggleNgo = false;
      this.active.classed("active", false);
      this.active = d3.select(null);
      d3.select("g.group")
        .transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "");
      this.tooltip.style("opacity", 0).transition();
    },
    clicked(d, id, arr) {
      const node = arr[id];
      const { width, height } = this;
      if (this.active.node() === node) {
        return this.reset();
      }
      this.toggleCity = true;
      this.toggleAgency = true;
      this.toggleNgo = true;
      this.active.classed("active", false);
      this.active = d3.select(node).classed("active", true);
      const bounds = this.path.bounds(d);
      const dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = 0.9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

      d3.select("g.group")
        .transition()
        .duration(750)
        .style("stroke-width", 1.5 / scale + "px")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
      this.tooltip
        .html(`State ${this.id_name_map[d.id].name}: ${this.id_name_map[d.id].sum}`)
        .transition()
        .duration(200)
        .style("opacity", 0.9)
        .style("left", d3.event.pageX - 100 + "px")
        .style("top", d3.event.pageY - 80 + "px");
    }
  }
});
