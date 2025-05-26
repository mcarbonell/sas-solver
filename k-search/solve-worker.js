
let id = '';
let cities = [];
let bestRoute = [];
let bestDistance = Infinity;
let bestPossibleDistance = 0;

let iteration = 0;
let improvements = 0;
let maxK = 0;

let currentK = 1;
let distances = [];
let costContribution = [];
let minPossible = [];
let initialHeuristics = [];
let localHeuristics = [];

let isRunning = true;
let improved = true;
let debug = false;

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}



function distance(city1, city2) {
    return distances[city1][city2];
}

function calcDistance(city1, city2) {
    return Math.sqrt(Math.pow(city2.x - city1.x, 2) + Math.pow(city2.y - city1.y, 2));
}

function calculateDistance(route) {
    let totalDistance = distances[route[route.length - 1]][route[0]];
    for (let i = 0; i < route.length - 1; i++) {
        totalDistance += distances[route[i]][route[i + 1]];
    }
    return totalDistance;
}

function sendStats() {
    self.postMessage({
        type: 'stats',
        id: id,
        iteration,
        improvements,
        bestDistance,
        currentK,
        bestPossibleDistance
    });
}

function updateBestRoute(routeDistance, currentRoute) {
    improved = true;
    improvements += 1;
    bestDistance = routeDistance;
    bestRoute = [...currentRoute];
    updateLocalHeuristics(bestRoute);
    sendStats();
    self.postMessage({
        type: 'improvement',
        id: id,
        route: bestRoute,
        distance: bestDistance,
        iteration,
        improvements,
        currentK
    });
}

function checkRoute(currentRoute) {
    let routeDistance = calculateDistance(currentRoute);
    if (routeDistance < bestDistance) {
        updateBestRoute(routeDistance, currentRoute);
    }

    iteration++;
    if ((iteration % 100000) == 0) {
        sendStats();
    }
}

function systematicAlternativesSearch(remainingCities, currentRoute, alternativesLeft) {
    if (remainingCities.size === 0) {
        checkRoute(currentRoute);
        return;
    }

    let currentCity = currentRoute[currentRoute.length - 1];
    let heuristic = localHeuristics[currentCity];
    let validCitiesFound = 0;

    for (let i = 0; i < heuristic.length && validCitiesFound <= alternativesLeft; i++) {
        if (!isRunning) return;

        let nextCity = heuristic[i];
        if (remainingCities.has(nextCity)) {
            validCitiesFound++;
            currentRoute.push(nextCity);
            remainingCities.delete(nextCity);
            systematicAlternativesSearch(remainingCities, currentRoute, alternativesLeft - (validCitiesFound - 1));
            remainingCities.add(nextCity);
            currentRoute.pop();
        }
    }
}


function initializeLocalHeuristics() {

    distances = cities.map((_, i) =>
        cities.map((_, j) => calcDistance(cities[i], cities[j]))
    );

    initialHeuristics = cities.map((_, i) =>
        cities.map((_, j) => j).filter(j => j !== i).sort((a, b) =>
            distances[i][a] - distances[i][b]
        )
    );

    localHeuristics = cities.map((_, i) =>
        cities.map((_, j) => j).filter(j => j !== i).sort((a, b) =>
            distances[i][a] - distances[i][b]
        )
    );

    bestPossibleDistance = 0;
    for (let i = 0; i < cities.length; i++) {
        let a = initialHeuristics[i][0];
        let b = initialHeuristics[i][1];
        minPossible[i] = distances[i][a] + distances[i][b];
        bestPossibleDistance += minPossible[i];
    }
    bestPossibleDistance = bestPossibleDistance / 2;
}

function updateLocalHeuristics(improvedRoute) {
    for (let i = 0; i < improvedRoute.length - 1; i++) {
        let city1 = improvedRoute[i];
        let city2 = improvedRoute[i + 1];

        if (localHeuristics[city1][0] !== city2)
            localHeuristics[city1] = [city2, ...localHeuristics[city1].filter(c => c !== city2)];
        if (localHeuristics[city2][0] !== city1)
            localHeuristics[city2] = [city1, ...localHeuristics[city2].filter(c => c !== city1)];
    }
}

function updateLocalHeuristics2(improvedRoute) {
    for (let i = 0; i < improvedRoute.length - 1; i++) {
        let city1 = improvedRoute[i];
        let city2 = improvedRoute[i + 1];

        if (localHeuristics[city1][0] !== city2)
            localHeuristics[city1] = [city2, ...initialHeuristics[city1].filter(c => c !== city2)];
        if (localHeuristics[city2][0] !== city1)
            localHeuristics[city2] = [city1, ...initialHeuristics[city2].filter(c => c !== city1)];
    }
}



function generateRandomSolution() {
    let randomSolution = cities.map((_, index) => index);
    shuffle(randomSolution);
    randomSolution.push(randomSolution[0]);

    return randomSolution;
}

function generateNearestSolution() {
    let remainingCities = new Set(cities.map((_, index) => index).filter(i => i !== 0));
    systematicAlternativesSearch(remainingCities, [0], 0);
}



function solve() {

    if (iteration == 0) {
        // Empezando con una solución aleatoria
        // bestRoute = generateRandomSolution();
        // bestDistance = calculateDistance(bestRoute);
        // updateBestRoute(bestDistance, bestRoute);

        // console.log('solve');
        // console.log('random solution:', bestDistance, bestRoute);
    }

    // Al aleatorizar el orden de exploración de ciudades le damos un toque no determinista
    // con esto obtendremos mínimos locales diferentes cada vez
    improved = true;
    let round = 0;
    while (improved) {
        improved = false;
        let order = [...Array(cities.length).keys()];
        shuffle(order);
        round++;
        for (let i = 0; i < cities.length; i++) {
            if (debug) console.log("bucle", currentK, round, i, (improved) ? '+' : ' ');
            let startCity = order[i];
            let remainingCities = new Set(cities.map((_, index) => index).filter(j => j !== startCity));
            systematicAlternativesSearch(remainingCities, [startCity], currentK);

            if (!isRunning) return;
        }
    }

    currentK++;
    if (currentK <= maxK) {
        setTimeout(solve, 0);
    } else {
        if (debug) console.log("END", iteration.toLocaleString('es-ES'), improvements);
        sendStats();
        self.postMessage({
            type: 'solution',
            id: id,
            route: bestRoute,
            distance: bestDistance,
            iteration,
            improvements,
            currentK: currentK - 1
        });
    }
}


self.onmessage = function (e) {
    if (e.data.type === 'start') {
        console.log('onmessage', e.data);
        id = e.data.id;
        cities = e.data.cities;
        debug = e.data.debug;
        maxK = e.data.maxK;

        if (debug) console.log('MaxK', maxK);

        bestRoute = [];
        bestDistance = Infinity;
        iteration = 0;
        improvements = 0;
        currentK = 0;

        // MaxK es el entero superior/inferior más próximo al logaritmo neperiano del numero de ciudades.
        // maxK = Math.floor(Math.log(cities.length));
        initializeLocalHeuristics();
        setTimeout(solve, 0);
    } else if (e.data.type === 'stop') {
        isRunning = false;
        console.log('onmessage', e.data);
    }
};

setInterval(sendStats, 1000);