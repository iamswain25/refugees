var app = new Vue({
  el: "#app",
  data: () => ({
    zoomed: false,
    width: window.innerWidth - 30,
    height: window.innerHeight - 100,
    name_id_map: {},
    id_name_map: {},
    cities: [],
    active: d3.select(null),
    path: null
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
      console.log(this);
    },
    async getMapNamesForId() {
      console.time("getMapNamesForId");
      try {
        await d3.tsv("js/us-state-names.tsv", (obj, index) => {
          this.name_id_map[obj.name] = obj;
          this.id_name_map[obj.id] = obj;
        });
        await d3.csv("js/cities.csv", (obj, index) => {
          this.cities.push(obj);
        });
        await d3.csv("js/grouped_by_and_sum.csv", (obj, index) => {
          var ori = this.name_id_map[obj.state];
          Object.assign(ori, obj);
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
      // console.log(this.state);
      const width = this.width;
      const height = this.height;
      var projection = d3
        .geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
      const path = d3.geoPath().projection(projection);
      this.path = path;
      var tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("fill-opacity", 0);
      const statesFeature = topojson.feature(us, us.objects.states).features;

      d3.select("g.states")
        .selectAll("path")
        .data(statesFeature)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "feature")
        .attr("style", d => {
          var opa = this.id_name_map[d.id].sum / 106605;
          opa = Math.round(opa * 100) / 100;
          var res = `fill-opacity: ${opa};`;
          //   if (opa <= 0.1) {
          //     res = `opacity: 0.5; fill: yellow;`;
          //   }
          return res;
        })
        .on("click", this.clicked)
        .on("mouseover", d => {
          if (this.zoomed) {
            return;
          }
          tooltip
            .transition()
            .duration(200)
            .style("fill-opacity", 0.9);
          tooltip
            .html(
              `${this.id_name_map[d.id].name}: ${this.id_name_map[d.id].sum}`
            )
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
        })
        .on("mouseout", function(d) {
          // if (!zoomed) { return }
          tooltip
            .transition()
            .duration(500)
            .style("opacity", 0);
        });
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
        .attr("r", "1px")
        .attr("stroke", "purple")
        .attr("fill", "red")
        .attr("stroke-width", "0.5px")
        .on("mouseover", function(d) {
          tooltip
            .transition()
            .duration(200)
            .style("opacity", 0.9);
          tooltip
            .html(`${d.city}: ${d.sum}`)
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
        })
        .on("mouseout", function(d) {
          tooltip
            .transition()
            .duration(500)
            .style("opacity", 0);
        });
      //   d3.select("g.states")
      //     .append("path")
      //     .datum(
      //       topojson.mesh(us, us.objects.states, function(a, b) {
      //         return a !== b;
      //       })
      //     )
      //     .attr("class", "mesh")
      //     .attr("d", path);

      console.timeEnd("draw");
    },
    reset() {
      this.zoomed = false;
      this.active.classed("active", false);
      this.active = d3.select(null);
      d3.select("g.group")
        .transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "");
    },
    clicked(d, id, arr) {
      const node = arr[id];
      const { width, height } = this;
      if (this.active.node() === node) {
        return this.reset();
      }
      this.zoomed = true;
      this.active.classed("active", false);
      this.active = d3.select(node).classed("active", true);
      const bounds = this.path.bounds(d);
      console.log(bounds);
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
    }
  }
});
