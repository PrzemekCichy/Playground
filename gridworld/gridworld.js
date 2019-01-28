/////////Config var///////
var matrixSize = 10;
var offset = 45;
//Create objectives and position them on the grid. The goal of reinforcement learning client would be to pick them up before it Receives  in a matrixSize*matrixSize array;
var objectives = [{ x: 0, y: 14 }, { x: 1, y: 6 }, { x: 3, y: 2 }, { x: 4, y: 12 }, { x: 7, y: 2 }, { x: 7, y: 6 }, { x: 9, y: 14 }, { x: 12, y: 8 }, { x: 14, y: 12 }, { x: 0, y: 14 }];
var Helpers;
(function (Helpers) {
    //Define standard margins for svg container
    var margin = {
        top: 20,
        right: 10,
        bottom: 20,
        left: 10
    };
    var width = matrixSize * offset + margin.left + margin.right, height = matrixSize * offset + margin.top + margin.bottom;
    Helpers.createSvg = function () {
        return d3.select("body").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    };
    Helpers.drawLine = function (svg, startX, startY, endX, endY, colour) {
        svg.append("line")
            .attr("x1", startX)
            .attr("y1", startY)
            .attr("x2", endX)
            .attr("y2", endY)
            .attr("stroke-width", "2")
            .attr("stroke", colour);
    };
    Helpers.drawGridLines = function (svg, matrixSize) {
        var gridLinesContainer = svg.append("g").attr("class", "gridLines");
        var noOfGridLines = matrixSize, length = offset * noOfGridLines;
        var x = 0, y = 0;
        for (var i = 0; i <= noOfGridLines; i++) {
            Helpers.drawLine(gridLinesContainer, x + offset * i, y, x + offset * i, y + length, "grey");
        }
        for (var j = 0; j <= noOfGridLines; j++) {
            Helpers.drawLine(gridLinesContainer, x, y + offset * j, x + length, y + offset * j, "grey");
        }
    };
    Helpers.drawGridObjective = function (svg, objectives, color, opacity) {
        if (color === void 0) { color = "grey"; }
        if (opacity === void 0) { opacity = 1; }
        var gridObjectives = svg.append("g").attr("class", "gridObjectives");
        objectives.forEach(function (obj, index) {
            obj.x *= offset;
            obj.y *= offset;
            Helpers.drawObjective(gridObjectives, [{ "x": obj.x, "y": obj.y },
                { "x": obj.x + offset, "y": obj.y },
                { "x": obj.x + offset, "y": obj.y + offset },
                { "x": obj.x, "y": obj.y + offset }
            ], color, opacity);
        });
    };
    Helpers.drawObjective = function (svg, points, fillColour, opacity) {
        svg.append("polygon")
            .data([points])
            .attr("points", function (d) {
            return d.map(function (d) {
                return [d.x, d.y].join(",");
            }).join(" ");
        })
            .attr("fill", fillColour)
            .attr("opacity", opacity);
    };
    Helpers.appendArrowMarker = function (svg) {
        svg.append("svg:defs").append("svg:marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr('refX', -8)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");
    };
    Helpers.drawArrows = function (svg, state, dimension, data) {
        var temp = [];
        var stateSvg = svg.append("g");
        var row = parseInt("" + state / dimension);
        data.forEach(function (actionProb, index) {
            var d = {};
            if (actionProb == 0)
                return;
            d["x"] = (state % dimension) * offset + offset / 2;
            d["y"] = row * offset + offset / 2;
            d["directionX"] = 0;
            d["directionY"] = 0;
            if (index == 0)
                d["directionY"] = -1;
            else if (index == 1)
                d["directionX"] = 1;
            else if (index == 2)
                d["directionY"] = 1;
            else if (index == 3)
                d["directionX"] = -1;
            d["actionProb"] = actionProb;
            var path = stateSvg.append("path")
                .attr("class", "link")
                .style("stroke", "#000")
                .attr('marker-start', function (d) { return "url(#arrow)"; })
                .style("stroke-width", 2)
                .attr("d", "M" + d.x + "," + d.y + ", " + (d.x + offset / 4 * d.directionX * Math.max(0.5, actionProb)) + "," + (d.y + offset / 4 * d.directionY * Math.max(0.5, actionProb)));
        });
        return;
    };
    Helpers.drawText = function (svg, x, y, text) {
        return svg.append("text")
            .attr("x", x)
            .attr("y", y)
            .text(text)
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black")
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "middle");
    };
    Helpers.populateArray = function (length, data) {
        var array = new Array(length);
        for (var i = 0; i < length; i++) {
            array[i] = (data);
        }
        return array;
    };
    Helpers.populateMatrix = function (rows, columns, data) {
        var matrix = [];
        for (var i = 0; i < rows; i++) {
            matrix[i] = [];
            for (var j = 0; j < columns; j++) {
                matrix[i][j] = data;
            }
        }
        return matrix;
    };
    Helpers.Argmax = function (array) {
        return array.map(function (x, i) { return [x, i]; }).reduce(function (r, a) { return (a[0] > r[0] ? a : r); })[1];
    };
    Helpers.convertStatesToCoords = function (states, matrixSize) {
        var coords = [];
        states.forEach(function (state, index) {
            coords.push({ x: parseInt("" + state / matrixSize), y: state % matrixSize });
        });
        return coords;
    };
})(Helpers || (Helpers = {}));
//From first point, compute the closest point possible, match,go to it and find the closest and so on
//Remove matched entries from the list
//if list is empty loop back to the first point
var NearestNeighbour = /** @class */ (function () {
    function NearestNeighbour() {
        this.nnSvg = Helpers.createSvg().append("g").attr("class", "nodePaths");
        Helpers.drawGridLines(this.nnSvg, matrixSize);
        Helpers.drawGridObjective(this.nnSvg, objectives);
        var index = 0;
        var distance = 9007199254740991;
        var firstNode = objectives[0];
        var start = firstNode;
        objectives.splice(0, 1);
        console.log(firstNode, objectives);
        var position = 0;
        while (objectives.length > 0) {
            var temp_node = firstNode;
            objectives.forEach(function (node, temp_position) {
                //Use pythagorean theorem to find the shortest diagonal?
                console.log(firstNode.x, node.x, firstNode.y, node.y);
                var temp_distance = Math.sqrt(Math.pow(temp_node.x - node.x, 2) + Math.pow(temp_node.y - node.y, 2));
                if (temp_distance < distance) {
                    distance = temp_distance;
                    firstNode = node;
                    position = temp_position;
                }
            });
            Helpers.drawLine(this.nnSvg, temp_node.x + offset / 2, temp_node.y + offset / 2, firstNode.x + offset / 2, firstNode.y + offset / 2, "red");
            objectives.splice(position, 1);
            distance = 9007199254740991;
            index++;
        }
        console.log("No of itterations: ", index);
        Helpers.drawLine(this.nnSvg, start.x + offset / 2, start.y + offset / 2, firstNode.x + offset / 2, firstNode.y + offset / 2, "blue");
    }
    return NearestNeighbour;
}());
var DynamicProgramming = /** @class */ (function () {
    function DynamicProgramming(numberOfActions, numberOfStates) {
        if (numberOfActions === void 0) { numberOfActions = 4; }
        if (numberOfStates === void 0) { numberOfStates = 16; }
        this.dpSvg = Helpers.createSvg();
        this.policySvg = Helpers.createSvg();
        this.policyEvaluationDelay = 0;
        /*0: {0: [(1.0, 0, 0.0, True)],
         1: [(1.0, 0, 0.0, True)],
         2: [(1.0, 0, 0.0, True)],
         3: [(1.0, 0, 0.0, True)]}
         */
        this.createTransitionList = function (noOfStates, noOfActions, terminalStates, prob, nextStateRules) {
            var list = {};
            var stateMatrix = Helpers.populateMatrix(Math.sqrt(noOfStates), Math.sqrt(noOfStates), 0);
            var i = 0;
            stateMatrix.forEach(function (row, rowIndex) {
                row.forEach(function (state, index) {
                    stateMatrix[rowIndex][index] = i++;
                });
            });
            console.log("state matrix", stateMatrix);
            for (var s = 0; s < noOfStates; s++) {
                var isTerminalState = terminalStates.includes(s);
                var nextStates = nextStateRules(s, noOfStates, stateMatrix, isTerminalState);
                var stateTuples = {};
                for (var a = 0; a < noOfActions; a++) {
                    var reward = isTerminalState ? 0 : -1;
                    var isTerminal = terminalStates.includes(nextStates[a]);
                    stateTuples[a] = [prob, nextStates[a], reward, isTerminal];
                }
                list[s] = stateTuples;
            }
            return list;
        };
        this.transitionFunction = function (s, noOfStates, stateMatrix, isTerminal) {
            if (isTerminal)
                return [s, s, s, s];
            var up, right, down, left;
            var matrixSize = Math.sqrt(noOfStates), row = parseInt("" + s / matrixSize);
            if (typeof stateMatrix[row - 1] == "undefined") {
                up = s;
            }
            else {
                up = stateMatrix[row - 1][s % matrixSize];
            }
            if (typeof stateMatrix[row][s % matrixSize + 1] == "undefined") {
                right = s;
            }
            else {
                right = stateMatrix[row][s % matrixSize + 1];
            }
            if (typeof stateMatrix[row + 1] == "undefined") {
                down = s;
            }
            else {
                down = stateMatrix[row + 1][s % matrixSize];
            }
            if (typeof stateMatrix[row][s % matrixSize - 1] == "undefined") {
                left = s;
            }
            else {
                left = stateMatrix[row][s % matrixSize - 1];
            }
            return [up, right, down, left];
        };
        this.numberOfActions = numberOfActions;
        this.numberOfStates = numberOfStates;
        Helpers.appendArrowMarker(this.dpSvg);
        Helpers.drawGridLines(this.dpSvg, matrixSize);
        Helpers.appendArrowMarker(this.policySvg);
        Helpers.drawGridLines(this.policySvg, matrixSize);
        //Helpers.drawGridObjective(dpSvg, objectives);
    }
    ////Policy Evaluation/////
    DynamicProgramming.prototype.EvaluatePolicy = function (environment, policy, discount_factor, theta) {
        var _this = this;
        if (discount_factor === void 0) { discount_factor = 1.0; }
        if (theta === void 0) { theta = 0.01; }
        var V = Helpers.populateArray(this.numberOfStates, 0);
        var itteration = 0;
        var totalTimeout = 0;
        var maxState = 1;
        //Repeat until convergance
        var itterate = function () {
            var delta = 0;
            //For each square in the grid
            for (var s = 0; s < _this.numberOfStates; s++) {
                var v = 0;
                policy[s].forEach(function (action_probability, action) {
                    var stateTuple = environment[s][action];
                    v += action_probability * stateTuple[0] * (stateTuple[2] + discount_factor * V[stateTuple[1]]);
                });
                delta = Math.max(delta, Math.abs(v - V[s]));
                if (v < maxState)
                    maxState = v;
                V[s] = v;
            }
            setTimeout(function (data, itteration, maxState) {
                _this.dpSvg.selectAll("text").remove();
                _this.dpSvg.selectAll("polygon").remove();
                var _V = data;
                var _i = itteration;
                for (var s = 0; s < _this.numberOfStates; s++) {
                }
                _V.forEach(function (state, index) {
                    Helpers.drawGridObjective(_this.dpSvg, Helpers.convertStatesToCoords([index], matrixSize), "green", 0.6 - (Math.abs(state / maxState) * 0.6));
                    var row = parseInt("" + index / matrixSize);
                    Helpers.drawText(_this.dpSvg, (index % matrixSize) * offset + offset / 2, row * offset + offset / 2, Number(state).toFixed(2));
                });
                Helpers.drawText(_this.dpSvg, matrixSize * offset / 2, matrixSize * offset + offset / 2, "Delta: " + delta.toFixed(theta.toString().length) + "Theta: " + theta);
                Helpers.drawText(_this.dpSvg, matrixSize * offset / 2, matrixSize * offset + offset, _i);
            }, totalTimeout += 30, JSON.parse(JSON.stringify(V)), itteration, maxState);
            _this.policyEvaluationDelay = totalTimeout;
            itteration++;
            if (delta > theta) {
                return itterate();
            }
            else {
                return V;
            }
        };
        console.log("Returned Itterate");
        return itterate();
    };
    DynamicProgramming.prototype.ImprovePolicy = function (environment, discount_factor, drawText) {
        var _this = this;
        if (discount_factor === void 0) { discount_factor = 1.0; }
        if (drawText === void 0) { drawText = false; }
        //Helper function to calculate the value for all action in a given state.
        var oneStepLookahead = function (state, environment, V) {
            var A = Helpers.populateArray(_this.numberOfActions, 0);
            for (var action = 0; action < _this.numberOfActions; action++) {
                var stateTuple = environment[state][action];
                A[action] += stateTuple[0] * (stateTuple[2] + discount_factor * V[stateTuple[1]]);
            }
            return A;
        };
        var policy = Helpers.populateMatrix(this.numberOfStates, this.numberOfActions, 1 / this.numberOfActions);
        policy.forEach(function (actions, state) {
            Helpers.drawArrows(_this.policySvg, state, matrixSize, actions);
        });
        //Repeat until convergance
        var itterate = function () {
            var chosenA, bestA, V, actionValues, stable = true;
            policy.forEach(function (actions, state) {
                Helpers.drawArrows(_this.policySvg, state, matrixSize, actions);
            });
            V = _this.EvaluatePolicy(environment, policy);
            console.log(V);
            V.forEach(function (value, state) {
                chosenA = Helpers.Argmax(policy[state]);
                actionValues = oneStepLookahead(state, environment, V);
                bestA = Helpers.Argmax(actionValues);
                if (chosenA == bestA) {
                    stable = true;
                }
                policy[state] = Helpers.populateArray(_this.numberOfActions, 0);
                policy[state][bestA] = 1;
            });
            console.log("sadasd", _this.policyEvaluationDelay);
            setTimeout(function () {
                _this.policySvg.selectAll("path").remove();
                policy.forEach(function (actions, state) {
                    Helpers.drawArrows(_this.policySvg, state, matrixSize, actions);
                });
            }, _this.policyEvaluationDelay + 3);
            if (stable)
                return { "V": V, "policy": policy };
            itterate();
        };
        return itterate();
    };
    return DynamicProgramming;
}());
var DP;
window.onload = function (e) {
    //new NearestNeighbour();
    var noOfStates = matrixSize * matrixSize, noOfActions = 4;
    var random_policy = Helpers.populateMatrix(noOfStates, noOfActions, 1 / noOfActions);
    DP = new DynamicProgramming(noOfActions, noOfStates);
    var terminalStates = [0, 33, noOfStates - 1];
    var environment = DP.createTransitionList(noOfStates, 4, terminalStates, 1, DP.transitionFunction);
    Helpers.drawGridObjective(DP.dpSvg, Helpers.convertStatesToCoords(terminalStates, matrixSize));
    Helpers.drawGridObjective(DP.policySvg, Helpers.convertStatesToCoords(terminalStates, matrixSize));
    //var evaluatedPolicy = DP.EvaluatePolicy(environment, random_policy);
    console.time("ImprovePolicy");
    var improvedPolicy = DP.ImprovePolicy(environment);
    console.timeEnd("ImprovePolicy");
    //console.log(improvedPolicy)
    console.log(environment);
};
