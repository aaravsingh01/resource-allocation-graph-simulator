// Initialize graph data
let graph = {
    nodes: [],
    links: []
};

// Graph dimensions
const width = 800;
const height = 500;

// Create SVG container
const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Function to update graph visualization
function updateGraph() {
    // Clear existing graph
    svg.selectAll("*").remove();

    // Draw nodes
    const nodes = svg.selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => d.type === "process" ? "#4CAF50" : "#2196F3");

    // Draw links
    const links = svg.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke", "#555")
        .attr("stroke-width", 2);
}

// Event listeners for buttons
document.getElementById("add-process").addEventListener("click", () => {
    graph.nodes.push({
        id: `p${graph.nodes.length + 1}`,
        type: "process",
        x: Math.random() * (width - 40) + 20,
        y: Math.random() * (height - 40) + 20
    });
    updateGraph();
});

document.getElementById("add-resource").addEventListener("click", () => {
    graph.nodes.push({
        id: `r${graph.nodes.length + 1}`,
        type: "resource",
        x: Math.random() * (width - 40) + 20,
        y: Math.random() * (height - 40) + 20
    });
    updateGraph();
});

// Initialize graph with some default nodes
updateGraph();
