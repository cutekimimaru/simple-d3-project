var WORLD_MAP_SVG_W = 1000;
var WORLD_MAP_SVG_H = 500;

function showAlert(msg1, msg2) {
    var msg = msg1+" "+msg2;
    return msg;
}

function getRandomInt(n, m) {
    console.log("your input", n, m);
    return Math.ceil((m-n)*Math.random()+n);
}

// draw the five lines
function drawLines () {
    for (var i=0; i<5; i=i+1) {
        d3.select(".melody>svg")
          .append("line")
          .attr({
            x1: 0,
            y1: 45 + i * 30,
            x2: 300,
            y2: 45 + i * 30,
            stroke: "black",
            "stroke-width": 2
            });    
    }
}

/*
 * For Final Project
 */

function main() {
    d3.json("./data/fifa16.json", function(dataSet){
        var nationSummary = bindNation(dataSet);
        var nationPlayers = getSummaryPlayers(dataSet);

        bindTotalPlayers(dataSet);
        bindClub(dataSet);
        bindTotalPrice(dataSet);

        // world map
        svgWorldMap(nationPlayers);
        svgBarChart();
    });
}

function getSummaryPlayers(dataSet) {
    var n = [];
    dataSet.map((tile) => {
        var found = n.find(x => x.name === tile.nation.name)
        if (found != undefined) {
            found.players.push(tile.name);
            found.num += 1;
        } else {
            n.push({name: tile.nation.name, players: [tile.name], num: 1})
        }
    });
    return n;
}

function svgWorldMap(nationPlayers) {
    d3.json("./data/world.json", function(world) {
        bindWorldMap(world, nationPlayers);
        renderWorldMap();
    });
}

function bindWorldMap(topoData, nationPlayers) {
    var svg = d3
        .select(".world-map")
        .append("svg")
        .attr({
            width: WORLD_MAP_SVG_W,
            height: WORLD_MAP_SVG_H
        });
    
    var projection = d3.geo.equirectangular()
        .scale(WORLD_MAP_SVG_H / Math.PI ) // 投影後的地圖大小
        .translate([WORLD_MAP_SVG_W / 2, WORLD_MAP_SVG_H / 2]); // translate代表投影後的中心位置
   // var projection = d3.geo.mercator().center([121, 24]).scale(6000);
    
    var path = d3.geo.path().projection(projection);
    
    var countries = topojson.feature(topoData, topoData.objects.countries).features;
    //var countries = topojson.feature(topoData, topoData.objects.county).features;
    var selection = svg.selectAll("path").data(countries);
    
    selection.enter().append("path");
    selection.exit().remove();
    selection.classed("map-boundary", true).attr("d", path);
    
    var g = svg.append("g");
    
    // draw the circles of the country
    d3.json("./data/capitals.json", function(error, captitals){
        
        // find match
        var drawn = [];
        nationPlayers.map(function(tile){
            var found = captitals.find(x => x.CountryName.toLowerCase() === tile.name.toLowerCase() );
            if (found !== undefined) {
                found.num = tile.num;
                found.players = tile.players;
                drawn.push(found);
            } 
        });
        
        bindNationCircles(drawn);
        renderNationCircles(projection);
    });
        
}

function bindNationCircles(dataSet) {
    
    var selection = d3.select("svg").selectAll("circle").data(dataSet);
    selection.enter().append("circle");
    selection.exit().remove();   
}

function renderNationCircles(projection) {
    var fScale = d3.scale.category10();
    d3.selectAll("circle").attr({
        cx: function(d) {
            return projection([d.CapitalLongitude, d.CapitalLatitude])[0];
        },
        cy: function(d) {
            return projection([d.CapitalLongitude, d.CapitalLatitude])[1];
        },
        r: function(d) {
            return d.num < 5 ? 5 : d.num;
        },
        fill: function(d) {
            return fScale(d.num);
        }
    }).on("mouseover", function(d){
        var xPos = parseFloat(d3.select(this).attr("cx"))+100;
        var yPos = parseFloat(d3.select(this).attr("cy"))+150;
        var tooltip = d3.select("#tooltip")
            .style({
                left: xPos + "px",
                top: yPos + "px"
            });
        d3.select(".nation").text(d.CountryName + ' (' + d.num + ')');
        var selection = d3.select(".players").selectAll(".players div").data(d.players);
        selection.enter().append("div");
        selection.exit().remove();
        d3.select(".players").selectAll(".players div").text(function(d){ return d; });
        d3.select("#tooltip").classed("hidden", false);
    }).on("mouseout", function(d){
        d3.select("#tooltip").classed("hidden", true);
    });
    ;
}

function renderWorldMap() {
    d3.selectAll("path").attr({fill: "#DDD"});
}

function svgBarChart() {
    d3
        .select(".bar-chart")
        .append("svg")
        .attr({
            width: 600,
            height: "100%"
        });
    d3
        .select(".bar-chart>svg")
        .append("g")
        .append("rect")
        .attr({
            width: 600,
            height: "100%",
            fill: "green"
        });
}

function bindTotalPlayers(dataSet) {
    d3
        .select("#num_players")
        .text(dataSet.length)
}

function bindNation(dataSet) {
    var nationArr = dataSet.map((tile) => {
        return tile.nation.name;
    });
    
    var nationSummary = getSummary(nationArr);
    d3
        .select("#num_nations")
        .text(nationSummary.length);
    
    return nationSummary;
}

function bindClub(dataSet) {
    var clubArr = dataSet.map((tile) => {
        return tile.club.name;
    });
    
    var clubSummary = getSummary(clubArr);
    d3
        .select("#num_clubs")
        .text(clubSummary.length);
}

function bindTotalPrice(dataSet) {
    var priceArr = dataSet.map((tile) => {
        return tile.price;
    })
    
    var totalValue = priceArr.reduce((a, b) => { return a + b }, 0);
    d3
        .select("#total_price")
        .text(totalValue);
}

function getSummary(array) {
    
    var n = [];
    array.map((tile) => {
        var found = n.find(x => x.name === tile);
        if (found !== undefined) {
            found.num += 1
        } else {
            n.push({name: tile, num: 1})
        }    
    });
    return n
}