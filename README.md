# MapGenerator [![Build Status](https://travis-ci.com/Sarratas/MapGenerator.svg?branch=master)](https://travis-ci.com/Sarratas/MapGenerator) [![Coverage Status](https://coveralls.io/repos/github/Sarratas/MapGenerator/badge.svg)](https://coveralls.io/github/Sarratas/MapGenerator)

* [General Info](#general-info)
* [Technologies](#technologies)
* [Installation Guide](#installation-guide)

--------------

## General Info
MapGenerator allows to generate simple 2d map and render it on HTML5 canvas element. There is support for scrolling and zooming of the generated map. Several generation parameters can be adjusted.  
Path calculation feature allows to find the fastest way between two points using A* search algorithm. 

## Technologies
* TypeScript (typed superset of JavaScript)
* Webpack (module bundler)
* Sass (css preprocessor)
* prando (deterministic pseudo-random number generator)
* fastpriorityqueue (fast, heap-based priority queue)
* ts-jest (TypeScript preprocessor with sourcemap support for Jest)
* jest (JavaScript testing framework)
* tslint (static analysis tool for TypeScript)  
  
* travis (continuous integration service)
* coveralls (test coverage history & statistics)

## Installation Guide

### Prerequisites
Download and install nodejs with npm via https://nodejs.org/en/download/ or your system's specific package manager.
Download and install git via https://git-scm.com/downloads or package manager.

### Project installation
Clone this repository using:  
```bash
git clone https://github.com/Sarratas/MapGenerator
```
Move to project catalog and run install through npm:  
```bash
npm install
```
### Local development
To run locally using webpack-dev-server with watch mode:  
```bash
npm start
```

### Testing
To run unit tests using jest: 
```bash
npm test
```

To run linting through ts-lint
```bash
npm run lint
```
