// Verify D3.js is loaded
if (typeof d3 === 'undefined') {
    console.error("D3.js not loaded!");
    alert("Error: D3.js library failed to load. Please check your internet connection.");
    throw new Error("D3.js library required");
}

console.log("D3.js version:", d3.version); // Debug D3 version

// Initialize graph data
let graph = {
    nodes: [],
    links: [],
    selectedNode: null,
    linkType: "assignment" // or "request"
};

// Graph dimensions
const width = 800;
const height = 500;

// Create SVG container
const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Add link type selector
document.getElementById("link-type").addEventListener("change", (e) => {
    graph.linkType = e.target.value;
});

// Function to save the current graph state
function saveGraph() {
    const graphState = JSON.stringify(graph);
    const blob = new Blob([graphState], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add event listener for the save button
document.getElementById("save-graph").addEventListener("click", saveGraph);

// Function to update graph visualization
function updateGraph() {
    // Clear existing graph
    svg.selectAll("*").remove();

    // Draw links first (so nodes appear on top)
    svg.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke", d => d.type === "assignment" ? "#4CAF50" : "#F44336")
        .attr("stroke-width", 2)
        .attr("marker-end", d => d.type === "request" ? "url(#arrowhead)" : null)
        .on("contextmenu", function(event, d) {
            event.preventDefault();
            // Remove this specific edge
            graph.links = graph.links.filter(link => link !== d);
            updateGraph();
        });

    // Draw nodes
    const nodes = svg.selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => d.type === "process" ? "#4CAF50" : "#2196F3")
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded))
        .on("click", nodeClicked)
        .on("contextmenu", function(event, d) {
            event.preventDefault();
            // Remove the node itself
            graph.nodes = graph.nodes.filter(node => node !== d);
            // Remove all edges connected to this node
            graph.links = graph.links.filter(link => 
                link.source !== d && link.target !== d
            );
            updateGraph();
        });

    // Add node labels
    svg.selectAll(".node-label")
        .data(graph.nodes)
        .enter()
        .append("text")
        .attr("class", "node-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y + 5)
        .attr("text-anchor", "middle")
        .text(d => d.id);

    // Add arrowhead marker for request edges
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#F44336");
}

// Drag functions for node movement
function dragStarted(event, d) {
    d3.select(this).raise().attr("stroke", "#000");
}

function dragged(event, d) {
    d.x = event.x;
    d.y = event.y;
    updateGraph();
}

function dragEnded(event, d) {
    d3.select(this).attr("stroke", null);
}

// Node click handler for creating edges
function nodeClicked(event, d) {
    if (!graph.selectedNode) {
        graph.selectedNode = d;
        d3.select(this).attr("stroke", "#FFC107").attr("stroke-width", 3);
    } else {
        if (graph.selectedNode !== d) {
            graph.links.push({
                source: graph.selectedNode,
                target: d,
                type: graph.linkType
            });
        }
        d3.selectAll(".node").attr("stroke", null).attr("stroke-width", 0);
        graph.selectedNode = null;
        updateGraph();
    }
}

// Initialize buttons and verify they exist
function initButtons() {
    const buttons = {
        addProcess: document.getElementById("add-process"),
        addResource: document.getElementById("add-resource"),
        clearGraph: document.getElementById("clear-graph"),
        detectDeadlock: document.getElementById("detect-deadlock"),
        saveGraph: document.getElementById("save-graph") // Ensure save button is included
    };

    // Check all buttons exist
    for (const [name, btn] of Object.entries(buttons)) {
        if (!btn) {
            console.error(`Button ${name} not found!`);
            return false;
        }
    }

    // Add event listeners
    buttons.addProcess.addEventListener("click", () => {
        console.log("Add Process button clicked"); // Debug log
        const newProcess = {
            id: `P${graph.nodes.filter(n => n.type === "process").length + 1}`,
            type: "process",
            x: Math.random() * (width - 40) + 20,
            y: Math.random() * (height - 40) + 20
        };
        console.log("Adding process:", newProcess); // Debug log
        graph.nodes.push(newProcess);
        updateGraph();
    });

    buttons.addResource.addEventListener("click", () => {
        graph.nodes.push({
            id: `R${graph.nodes.filter(n => n.type === "resource").length + 1}`,
            type: "resource",
            x: Math.random() * (width - 40) + 20,
            y: Math.random() * (height - 40) + 20
        });
        updateGraph();
    });

    buttons.clearGraph.addEventListener("click", () => {
        graph.nodes = [];
        graph.links = [];
        graph.selectedNode = null;
        updateGraph();
    });

    buttons.detectDeadlock.addEventListener("click", () => {
        if (graph.nodes.length === 0) {
            alert("Please add at least one process and resource first!");
            return;
        }
        
        // Reset node colors first
        svg.selectAll(".node")
            .attr("fill", d => d.type === "process" ? "#4CAF50" : "#2196F3");

        // Get all processes and resources
        const processes = graph.nodes.filter(n => n.type === "process");
        const resources = graph.nodes.filter(n => n.type === "resource");

        if (processes.length === 0 || resources.length === 0) {
            alert("Need at least one process AND one resource to detect deadlock!");
            return;
        }

        // Create adjacency matrices
        const allocation = Array(processes.length).fill().map(() => Array(resources.length).fill(0));
        const request = Array(processes.length).fill().map(() => Array(resources.length).fill(0));
        const available = Array(resources.length).fill(0);
        const totalResources = Array(resources.length).fill(0);

        // Initialize total resources (1 per resource)
        totalResources.fill(1);
        
        // Count actual assignments
        graph.links.forEach(link => {
            if (link.type === "assignment") {
                const rIdx = resources.findIndex(r => r === link.target);
                if (rIdx !== -1) {
                    if (totalResources[rIdx] > 0) {
                        totalResources[rIdx]--;
                    } else {
                        console.error(`Resource R${rIdx+1} over-allocated!`);
                    }
                }
            }
        });

        // Populate matrices from graph edges
        graph.links.forEach(link => {
            const pIdx = processes.findIndex(p => p === link.source);
            const rIdx = resources.findIndex(r => r === link.target);
            
            if (pIdx !== -1 && rIdx !== -1) {
                if (link.type === "assignment") {
                    allocation[pIdx][rIdx] = 1;
                    available[rIdx] = 0; // Resource is allocated
                } else {
                    request[pIdx][rIdx] = 1;
                }
            }
        });

        // Calculate available resources (total - allocated)
        // Initialize based on total instances (1 per resource type)
        available.fill(1);
        // Subtract allocated resources
        allocation.forEach(row => {
            row.forEach((alloc, i) => {
                if (alloc) {
                    if (available[i] > 0) {
                        available[i]--;
                    } else {
                        console.error(`Resource overallocation detected for R${i+1}`);
                        available[i] = 0;
                    }
                }
            });
        });

        // Debug output
        console.log("Allocation Matrix:", allocation);
        console.log("Request Matrix:", request);
        console.log("Available Resources:", available);

        // Improved Banker's algorithm implementation
        const work = [...available];
        const finish = Array(processes.length).fill(false);
        const safeSequence = [];
        let deadlock = false;
        let count = 0;
        const maxIterations = processes.length * 2; // Prevent infinite loops

        console.log("Initial Work:", work);

        while (count < maxIterations) {
            let found = false;
            
            for (let i = 0; i < processes.length; i++) {
                if (!finish[i] && request[i].every((val, j) => val <= work[j])) {
                    // Process can complete - release its resources
                    for (let j = 0; j < resources.length; j++) {
                        work[j] += allocation[i][j];
                    }
                    finish[i] = true;
                    safeSequence.push(processes[i].id);
                    found = true;
                    count++;
                }
            }
            
            if (!found) break;
        }

        // Check for deadlock
        deadlock = finish.some(f => !f);
        console.log("Final Work:", work);
        console.log("Final Finish Array:", finish);
        console.log("Deadlock Detected:", deadlock);
        console.log("Safe Sequence:", safeSequence);

        // Visual feedback with more details
        if (deadlock) {
            console.log("Deadlocked Processes:", 
                processes.filter((p, i) => !finish[i]).map(p => p.id));
            const deadlocked = processes.filter((p, i) => !finish[i]);
            deadlocked.forEach(p => {
                svg.selectAll(".node")
                    .filter(d => d === p)
                    .attr("fill", "#F44336");
            });
            
            alert(`Deadlock detected! Deadlocked processes: ${deadlocked.map(p => p.id).join(", ")}`);
        } else {
            alert(`System is safe! Possible execution sequence:\n${safeSequence.join(" → ")}`);
        }
    });

    return true; // Return true if all buttons initialized successfully
}

// Initialize buttons and graph
if (initButtons()) {
    updateGraph();
} else {
    console.error("Button initialization failed - check console for errors");
    alert("Failed to initialize buttons - check console for errors");
}
