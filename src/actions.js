// Copyright (c) 2020 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {csvParseRows} from 'd3-dsv';
import {push} from 'react-router-redux';

import {request, text as requestText, json as requestJson} from 'd3-request';
import {addDataToMap, loadFiles, toggleModal} from 'kepler.gl/actions';



import {
  LOADING_SAMPLE_ERROR_MESSAGE,
  LOADING_SAMPLE_LIST_ERROR_MESSAGE,
  MAP_CONFIG_URL
} from './constants/default-settings';
import {parseUri} from './utils/url';

// CONSTANTS
export const INIT = 'INIT';
export const LOAD_REMOTE_RESOURCE_SUCCESS = 'LOAD_REMOTE_RESOURCE_SUCCESS';
export const LOAD_REMOTE_RESOURCE_ERROR = 'LOAD_REMOTE_RESOURCE_ERROR';
export const LOAD_MAP_SAMPLE_FILE = 'LOAD_MAP_SAMPLE_FILE';
export const SET_SAMPLE_LOADING_STATUS = 'SET_SAMPLE_LOADING_STATUS';

// Sharing
export const PUSHING_FILE = 'PUSHING_FILE';
export const CLOUD_LOGIN_SUCCESS = 'CLOUD_LOGIN_SUCCESS';

// ACTIONS
export function initApp() {
  return {
    type: INIT
  };
}

export function loadRemoteResourceSuccess(response, config, options) {
  return {
    type: LOAD_REMOTE_RESOURCE_SUCCESS,
    response,
    config,
    options
  };
}

export function loadRemoteResourceError(error, url) {
  return {
    type: LOAD_REMOTE_RESOURCE_ERROR,
    error,
    url
  };
}

export function loadMapSampleFile(samples) {
  return {
    type: LOAD_MAP_SAMPLE_FILE,
    samples
  };
}

export function setLoadingMapStatus(isMapLoading) {
  return {
    type: SET_SAMPLE_LOADING_STATUS,
    isMapLoading
  };
}

/**
 * Actions passed to kepler.gl, called
 *
 * Note: exportFile is called on both saving and sharing
 *
 * @param {*} param0
 */
export function onExportFileSuccess({response = {}, provider, options}) {
  return dispatch => {
    // if isPublic is true, use share Url
    if (options.isPublic && provider.getShareUrl) {
      dispatch(push(provider.getShareUrl(false)));
    } else if (!options.isPublic && provider.getMapUrl) {
      // if save private map to storage, use map url
      dispatch(push(provider.getMapUrl(false)));
    }
  };
}

export function onLoadCloudMapSuccess({response, provider, loadParams}) {
  return dispatch => {
    if (provider.getMapUrl) {
      const mapUrl = provider.getMapUrl(false, loadParams);
      dispatch(push(mapUrl));
    }
  };
}
/**
 * this method detects whther the response status is < 200 or > 300 in case the error
 * is not caught by the actualy request framework
 * @param response the response
 * @returns {{status: *, message: (*|{statusCode}|Object)}}
 */
function detectResponseError(response) {
  if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
    return {
      status: response.statusCode,
      message: response.body || response.message || response
    };
  }
}


function joinFiles(rawData){

  var date1 = new Date("03/23/2020"); 
  const file1Array = csvParseRows(rawData[0][0]);
  const geoJsonMap = rawData[rawData.length-2];

  const header =  file1Array[0];

  var joinFile= header[0] + "," +
    header[1] + "," +
    header[2] + "," +
    header[3] + "," +
    header[4] + "," +
    header[5] + "," +
    "Long" + "," +
    header[7] + "," +
    header[8] + "," +
    header[9] + "," +
    header[10] + "," +
    header[11] + "," +
    "geojson," +
    "date\n";

  //files
  for(var i = 0; i<rawData.length-2; i++){

    const file = csvParseRows(rawData[i][0]);
    var dd = date1.getDate();

    var mm = date1.getMonth()+1; 
    const yyyy = date1.getFullYear();

    if(dd<10) 
    {
      dd=`0${dd}`;
    } 

    if(mm<10) 
    {
      mm=`0${mm}`;
    } 
    const dateString = `${mm},${dd},${yyyy}`;

    date1.setDate(date1.getDate() + 1)

    //rows
    for(var k = 1; k<file.length; k++){
    //console.log(confirmedRow.length == deathsRow.length);
      const row = file[k];

      const geojson = geoJsonMap[row[0]]
      //columns
      for(var j = 0; j<row.length; j++){
        joinFile = joinFile + "\"" + row[j] + "\",";
      }      
      if (geojson != null){
        joinFile = joinFile + "\"" + geojson.replace(/\"/g, "\"\"") + "\",";
      }else{
        joinFile = joinFile + ",";
      }

      //joinFile = joinFile + "\"" + "{\"\"type\"\": \"\"LineString\"\",\"\"coordinates\"\": [[-58.3867141, -34.6016724], [-58.388046, -34.601724], [-58.3895469, -34.6018105], [-58.3894607, -34.6030247], [-58.3894148, -34.6041908], [-58.3894125, -34.6042488], [-58.3893415, -34.6054426], [-58.3893196, -34.6066263], [-58.3892645, -34.6078317], [-58.3891868, -34.609105], [-58.389166, -34.6092809], [-58.3890649, -34.610095], [-58.3889687, -34.6112764], [-58.3889168, -34.6124787], [-58.3903475, -34.6125322], [-58.3903555, -34.6137279], [-58.3903758, -34.614812], [-58.3903721, -34.6156194]]}" + "\",";

      const dateValue = new Date(dateString).getTime();
      joinFile = joinFile + "\"" + dateValue + "\""  +"\n";
    }
  }


  return joinFile;
}



function denormalize(rawData){

  const deathsArray = csvParseRows(rawData[0][0]);
  const confirmedArray = csvParseRows(rawData[1][0]);

  console.log(deathsArray.length == confirmedArray.length);

  const header =  deathsArray[0];
  const headerCheck =  confirmedArray[0];

  console.log(header == headerCheck);

  var denormFile = header[0] + "," +
    header[1] + "," +
    header[2] + "," +
    header[3] + ",date,Deaths,Confirmed\n";

  for(var i = 1; i<deathsArray.length; i++){
    const deathsRow = deathsArray[i];
    const confirmedRow = confirmedArray[i];


    //console.log(confirmedRow.length == deathsRow.length);

    for(var j = 4; j<deathsRow.length; j++){
      const value = new Date(header[j].replace("/", ",")).getTime();
      denormFile = denormFile + "\"" + deathsRow[0] + "\"," +
        "\""+deathsRow[1] + "\"," +
        deathsRow[2] + "," +
        deathsRow[3] + "," + 
        value + "," +
        deathsRow[j] + "," +
        confirmedRow[j] +"\n";
    }
    
  }

  return denormFile;
}

const config1 = {
  "version": "v1",
  "config": {
    "visState": {
      "filters": [
        {
          "dataId": [
            "xip2xquoi"
          ],
          "id": "a1ly9ol7",
          "name": [
            "date"
          ],
          "type": "timeRange",
          "value": [
            1583666701200,
            1583752395000
          ],
          "enlarged": true,
          "plotType": "lineChart",
          "yAxis": {
            "name": "Confirmed",
            "type": "integer"
          }
        },
        {
          "dataId": [
            "xip2xquoi"
          ],
          "id": "an323nr8",
          "name": [
            "Confirmed"
          ],
          "type": "range",
          "value": [
            1,
            67800
          ],
          "enlarged": false,
          "plotType": "histogram",
          "yAxis": null
        }
      ],
      "layers": [
        {
          "id": "40120svc",
          "type": "point",
          "config": {
            "dataId": "xip2xquoi",
            "label": "Deaths",
            "color": [
              227,
              26,
              26
            ],
            "columns": {
              "lat": "Lat",
              "lng": "Long",
              "altitude": null
            },
            "isVisible": true,
            "visConfig": {
              "radius": 10,
              "fixedRadius": false,
              "opacity": 0.8,
              "outline": false,
              "thickness": 2,
              "strokeColor": null,
              "colorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "strokeColorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "radiusRange": [
                0,
                50
              ],
              "filled": true
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 18,
                "offset": [
                  0,
                  0
                ],
                "anchor": "start",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": null,
            "colorScale": "quantile",
            "strokeColorField": null,
            "strokeColorScale": "quantile",
            "sizeField": {
              "name": "Deaths",
              "type": "integer"
            },
            "sizeScale": "sqrt"
          }
        },
        {
          "id": "l2moamb",
          "type": "hexagon",
          "config": {
            "dataId": "xip2xquoi",
            "label": "Confirmed",
            "color": [
              218,
              112,
              191
            ],
            "columns": {
              "lat": "Lat",
              "lng": "Long"
            },
            "isVisible": true,
            "visConfig": {
              "opacity": 0.8,
              "worldUnitSize": 15,
              "resolution": 8,
              "colorRange": {
                "name": "Custom Palette",
                "type": "custom",
                "category": "Custom",
                "colors": [
                  "#E3611C"
                ]
              },
              "coverage": 1,
              "sizeRange": [
                0,
                500
              ],
              "percentile": [
                0,
                100
              ],
              "elevationPercentile": [
                0,
                100
              ],
              "elevationScale": 45.9,
              "colorAggregation": "count",
              "sizeAggregation": "sum",
              "enable3d": true
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 18,
                "offset": [
                  0,
                  0
                ],
                "anchor": "start",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": null,
            "colorScale": "quantile",
            "sizeField": {
              "name": "Confirmed",
              "type": "integer"
            },
            "sizeScale": "linear"
          }
        }
      ],
      "interactionConfig": {
        "tooltip": {
          "fieldsToShow": {
            "xip2xquoi": [
              "Province/State",
              "Country/Region",
              "Deaths",
              "Confirmed"
            ]
          },
          "enabled": true
        },
        "brush": {
          "size": 0.5,
          "enabled": false
        },
        "coordinate": {
          "enabled": false
        }
      },
      "layerBlending": "normal",
      "splitMaps": [],
      "animationConfig": {
        "currentTime": null,
        "speed": 1
      }
    },
    "mapState": {
      "bearing": -31.86206896551724,
      "dragRotate": true,
      "latitude": 11.36614176106782,
      "longitude": -7.7873970525801015,
      "pitch": 49.527153356405194,
      "zoom": 1.6236921453508306,
      "isSplit": false
    },
    "mapStyle": {
      "styleType": "dark",
      "topLayerGroups": {},
      "visibleLayerGroups": {
        "label": true,
        "road": true,
        "border": true,
        "building": true,
        "water": true,
        "land": true,
        "3d building": false
      },
      "threeDBuildingColor": [
        9.665468314072013,
        17.18305478057247,
        31.1442867897876
      ],
      "mapStyles": {}
    }
  }
}


const config2 = {
  "version": "v1",
  "config": {
    "visState": {
      "filters": [
        {
          "dataId": [
            "foez3ydok"
          ],
          "id": "a1ly9ol7",
          "name": [
            "date"
          ],
          "type": "timeRange",
          "value": [
            1585100160000,
            1585186144000
          ],
          "enlarged": true,
          "plotType": "lineChart",
          "yAxis": {
            "name": "Confirmed",
            "type": "integer"
          }
        },
        {
          "dataId": [
            "foez3ydok"
          ],
          "id": "an323nr8",
          "name": [
            "Confirmed"
          ],
          "type": "range",
          "value": [
            1,
            67800
          ],
          "enlarged": false,
          "plotType": "histogram",
          "yAxis": null
        }
      ],
      "layers": [
        {
          "id": "5vj17vi",
          "type": "geojson",
          "config": {
            "dataId": "foez3ydok",
            "label": "Deaths",
            "color": [
              227,
              26,
              26
            ],
            "columns": {
              "geojson": "geojson"
            },
            "isVisible": true,
            "visConfig": {
              "opacity": 0.8,
              "strokeOpacity": 0.8,
              "thickness": 2,
              "strokeColor": null,
              "colorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "strokeColorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "radius": 10,
              "sizeRange": [
                0,
                10
              ],
              "radiusRange": [
                0,
                50
              ],
              "heightRange": [
                0,
                500
              ],
              "elevationScale": 5,
              "stroked": true,
              "filled": false,
              "enable3d": false,
              "wireframe": false
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 18,
                "offset": [
                  0,
                  0
                ],
                "anchor": "start",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": null,
            "colorScale": "quantile",
            "sizeField": {
              "name": "Deaths",
              "type": "integer"
            },
            "sizeScale": "sqrt",
            "strokeColorField": null,
            "strokeColorScale": "quantile",
            "heightField": null,
            "heightScale": "linear",
            "radiusField": null,
            "radiusScale": "linear"
          }
        },
        {
          "id": "3m3grw8",
          "type": "geojson",
          "config": {
            "dataId": "foez3ydok",
            "label": "Confirmed",
            "color": [
              255,
              152,
              51
            ],
            "columns": {
              "geojson": "geojson"
            },
            "isVisible": true,
            "visConfig": {
              "opacity": 0.8,
              "strokeOpacity": 0.8,
              "thickness": 0.5,
              "strokeColor": null,
              "colorRange": {
                "name": "ColorBrewer Reds-6",
                "type": "singlehue",
                "category": "ColorBrewer",
                "colors": [
                  "#fee5d9",
                  "#fcbba1",
                  "#fc9272",
                  "#fb6a4a",
                  "#de2d26",
                  "#a50f15"
                ]
              },
              "strokeColorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "radius": 10,
              "sizeRange": [
                0,
                10
              ],
              "radiusRange": [
                0,
                50
              ],
              "heightRange": [
                0,
                500
              ],
              "elevationScale": 45.9,
              "stroked": true,
              "filled": true,
              "enable3d": true,
              "wireframe": false
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 18,
                "offset": [
                  0,
                  0
                ],
                "anchor": "start",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": {
              "name": "Confirmed",
              "type": "integer"
            },
            "colorScale": "quantile",
            "sizeField": {
              "name": "Confirmed",
              "type": "integer"
            },
            "sizeScale": "linear",
            "strokeColorField": null,
            "strokeColorScale": "quantile",
            "heightField": {
              "name": "Confirmed",
              "type": "integer"
            },
            "heightScale": "linear",
            "radiusField": null,
            "radiusScale": "linear"
          }
        }
      ],
      "interactionConfig": {
        "tooltip": {
          "fieldsToShow": {
            "foez3ydok": [
              "Deaths",
              "Confirmed"
            ]
          },
          "enabled": true
        },
        "brush": {
          "size": 0.5,
          "enabled": false
        },
        "coordinate": {
          "enabled": false
        }
      },
      "layerBlending": "normal",
      "splitMaps": [],
      "animationConfig": {
        "currentTime": null,
        "speed": 1
      }
    },
    "mapState": {
      "bearing": -28.536945812807875,
      "dragRotate": true,
      "latitude": 36.32759078708474,
      "longitude": -83.72159062521017,
      "pitch": 55.33850766542787,
      "zoom": 4.164134380159623,
      "isSplit": false
    },
    "mapStyle": {
      "styleType": "dark",
      "topLayerGroups": {},
      "visibleLayerGroups": {
        "label": true,
        "road": true,
        "border": true,
        "building": true,
        "water": true,
        "land": true,
        "3d building": false
      },
      "threeDBuildingColor": [
        9.665468314072013,
        17.18305478057247,
        31.1442867897876
      ],
      "mapStyles": {}
    }
  }
}

export function loadDataCounties(options) {
  return (dispatch, getState) => {
    var stateGetter = getState
    dispatch(setLoadingMapStatus(true));
    // breakdown url into url+query params
    var promiseArray = [];

    var y = {};
    options.fipsGeoJson.features.forEach(x => y[x.id] = JSON.stringify(x.geometry))
    
    options.dataUrls.forEach(x => promiseArray.push(loadRemoteRawData(x)));
    promiseArray.push(y);
    promiseArray.push(getState);

    Promise.all(promiseArray).then(
      // In this part we turn the response into a FileBlob
      // so we can use it to call loadFiles
      (rawData) => {

        const file = joinFiles(rawData);
        dispatch(loadFiles([new File([file], "COVID-19.csv")])).then(() => {

         // const datasetId= "COVID"

          const datasetId = Object.keys(getState().demo.keplerGl.map.visState.datasets)[0];
          const dataset =  getState().demo.keplerGl.map.visState.datasets[datasetId];

          var data = {
            fields: dataset.fields, 
            rows: dataset.allData 
          };

          var datasets = [{
            data: data,
            info: {
             format: "csv",
             id: datasetId,
             label: "COVID-19.csv"
            }
          }]

          //datasets = datasets[Object.keys(datasets)[0]]
          //datasets = [{[datasetId] : datasets }]
          //datasets[0][datasetId].id = datasetId



          var config = config2;
          config.config.visState.layers = config.config.visState.layers.map(x => {
            x.config.dataId = datasetId; 
            return x
          })
          config.config.visState.filters = config.config.visState.filters.map(x => {
            x.dataId = datasetId ; 
            return x
          })
          config.config.visState.interactionConfig.tooltip.fieldsToShow = {
            [datasetId]: [
              "Province/State",
              "Country/Region",
              "Deaths",
              "Confirmed"
            ]
          },

          console.log(config);
          dispatch(addDataToMap({config, datasets})).then(()=>{
            console.log(getState().demo.keplerGl.map.visState)
            dispatch(setLoadingMapStatus(false))
          });
        }
        );
      },
      error => {
        const {target = {}} = error;
        const {status, responseText} = target;
        dispatch(loadRemoteResourceError({status, message: responseText}, options.dataUrl));
      }
    );
  };
}



export function loadDataHist(options) {
  return (dispatch, getState) => {
    var stateGetter = getState
    dispatch(setLoadingMapStatus(true));
    // breakdown url into url+query params
    Promise.all([loadRemoteRawData(options.dataUrls[0]), loadRemoteRawData(options.dataUrls[1]), getState]).then(
      // In this part we turn the response into a FileBlob
      // so we can use it to call loadFiles
      (rawData) => {

        const file = denormalize(rawData);
        dispatch(loadFiles([new File([file], "COVID-19.csv")])).then(() => {

         // const datasetId= "COVID"

          const datasetId = Object.keys(getState().demo.keplerGl.map.visState.datasets)[0];
          const dataset =  getState().demo.keplerGl.map.visState.datasets[datasetId];

          var data = {
            fields: dataset.fields, 
            rows: dataset.allData 
          };

          var datasets = [{
            data: data,
            info: {
             format: "csv",
             id: datasetId,
             label: "COVID-19.csv"
            }
          }]

          //datasets = datasets[Object.keys(datasets)[0]]
          //datasets = [{[datasetId] : datasets }]
          //datasets[0][datasetId].id = datasetId



          var config = config1;
          config.config.visState.layers = config.config.visState.layers.map(x => {
            x.config.dataId = datasetId; 
            return x
          })
          config.config.visState.filters = config.config.visState.filters.map(x => {
            x.dataId = datasetId ; 
            return x
          })
          config.config.visState.interactionConfig.tooltip.fieldsToShow = {
            [datasetId]: [
              "Province/State",
              "Country/Region",
              "Deaths",
              "Confirmed"
            ]
          },

          console.log(config);

          dispatch(addDataToMap({config, datasets})).then(()=>{
            console.log(getState().demo.keplerGl.map.visState)
            dispatch(setLoadingMapStatus(false))
          });
          dispatch(setLoadingMapStatus(false))

        }
        );
      },
      error => {
        const {target = {}} = error;
        const {status, responseText} = target;
        dispatch(loadRemoteResourceError({status, message: responseText}, options.dataUrl));
      }
    );
  };
}



// This can be moved into Kepler.gl to provide ability to load data from remote URLs
/**
 * The method is able to load both data and kepler.gl files.
 * It uses loadFile action to dispatcha and add new datasets/configs
 * to the kepler.gl instance
 * @param options
 * @param {string} options.dataUrl the URL to fetch data from. Current supoprted file type json,csv, kepler.json
 * @returns {Function}
 */
export function loadRemoteMap(options) {
  return dispatch => {
    dispatch(setLoadingMapStatus(true));
    // breakdown url into url+query params
    loadRemoteRawData(options.dataUrl).then(
      // In this part we turn the response into a FileBlob
      // so we can use it to call loadFiles
      ([file, url]) => {
        const {file: filename} = parseUri(url);
        dispatch(loadFiles([new File([file], filename)])).then(() =>
          dispatch(setLoadingMapStatus(false))
        );
      },
      error => {
        const {target = {}} = error;
        const {status, responseText} = target;
        dispatch(loadRemoteResourceError({status, message: responseText}, options.dataUrl));
      }
    );
  };
}

/**
 * Load a file from a remote URL
 * @param url
 * @returns {Promise<any>}
 */
function loadRemoteRawData(url) {
  if (!url) {
    // TODO: we should return reject with an appropriate error
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    request(url, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      const responseError = detectResponseError(result);
      if (responseError) {
        reject(responseError);
        return;
      }
      resolve([result.response, url]);
    });
  });
}

// The following methods are only used to load SAMPLES
/**
 *
 * @param {Object} options
 * @param {string} [options.dataUrl] the URL to fetch data from, e.g. https://raw.githubusercontent.com/uber-web/kepler.gl-data/master/earthquakes/data.csv
 * @param {string} [options.configUrl] the URL string to fetch kepler config from, e.g. https://raw.githubusercontent.com/uber-web/kepler.gl-data/master/earthquakes/config.json
 * @param {string} [options.id] the id used as dataset unique identifier, e.g. earthquakes
 * @param {string} [options.label] the label used to describe the new dataset, e.g. California Earthquakes
 * @param {string} [options.queryType] the type of query to execute to load data/config, e.g. sample
 * @param {string} [options.imageUrl] the URL to fetch the dataset image to use in sample gallery
 * @param {string} [options.description] the description used in sample galley to define the current example
 * @param {string} [options.size] the number of entries displayed in the current sample
 * @param {string} [keplergl] url to fetch the full data/config generated by kepler
 * @returns {Function}
 */
export function loadSample(options, pushRoute = true) {
  return (dispatch, getState) => {
    const {routing} = getState();
    if (options.id && pushRoute) {
      dispatch(push(`/demo/${options.id}${routing.locationBeforeTransitions.search}`));
    }
    // if the sample has a kepler.gl config file url we load it
    if (options.keplergl) {
      dispatch(loadRemoteMap({dataUrl: options.keplergl}));
    } else {
      dispatch(loadRemoteSampleMap(options));
    }

    dispatch(setLoadingMapStatus(true));
  };
}

/**
 * Load remote map with config and data
 * @param options {configUrl, dataUrl}
 * @returns {Function}
 */
function loadRemoteSampleMap(options) {
  return dispatch => {
    // Load configuration first
    const {configUrl, dataUrl} = options;

    Promise.all([loadRemoteConfig(configUrl), loadRemoteData(dataUrl)]).then(
      ([config, data]) => {
        // TODO: these two actions can be merged
        dispatch(loadRemoteResourceSuccess(data, config, options));
        dispatch(toggleModal(null));
      },
      error => {
        if (error) {
          const {target = {}} = error;
          const {status, responseText} = target;
          dispatch(
            loadRemoteResourceError(
              {
                status,
                message: `${responseText} - ${LOADING_SAMPLE_ERROR_MESSAGE} ${options.id} (${configUrl})`
              },
              configUrl
            )
          );
        }
      }
    );
  };
}

/**
 *
 * @param url
 * @returns {Promise<any>}
 */
function loadRemoteConfig(url) {
  if (!url) {
    // TODO: we should return reject with an appropriate error
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    requestJson(url, (error, config) => {
      if (error) {
        reject(error);
        return;
      }
      const responseError = detectResponseError(config);
      if (responseError) {
        reject(responseError);
        return;
      }
      resolve(config);
    });
  });
}

/**
 *
 * @param url to fetch data from (csv, json, geojson)
 * @returns {Promise<any>}
 */
function loadRemoteData(url) {
  if (!url) {
    // TODO: we should return reject with an appropriate error
    return Promise.resolve(null);
  }

  let requestMethod = requestText;
  if (url.includes('.json') || url.includes('.geojson')) {
    requestMethod = requestJson;
  }

  // Load data
  return new Promise((resolve, reject) => {
    requestMethod(url, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      const responseError = detectResponseError(result);
      if (responseError) {
        reject(responseError);
        return;
      }
      resolve(result);
    });
  });
}

/**
 *
 * @param sampleMapId optional if we pass the sampleMapId, after fetching
 * map sample configurations we are going to load the actual map data if it exists
 * @returns {function(*)}
 */
export function loadSampleConfigurations(sampleMapId = null) {
  return dispatch => {
    requestJson(MAP_CONFIG_URL, (error, samples) => {
      if (error) {
        const {target = {}} = error;
        const {status, responseText} = target;
        dispatch(
          loadRemoteResourceError(
            {status, message: `${responseText} - ${LOADING_SAMPLE_LIST_ERROR_MESSAGE}`},
            MAP_CONFIG_URL
          )
        );
      } else {
        const responseError = detectResponseError(samples);
        if (responseError) {
          dispatch(loadRemoteResourceError(responseError, MAP_CONFIG_URL));
          return;
        }

        dispatch(loadMapSampleFile(samples));
        // Load the specified map
        const map = sampleMapId && samples.find(s => s.id === sampleMapId);
        if (map) {
          dispatch(loadSample(map, false));
        }
      }
    });
  };
}
