mapboxgl.accessToken = 'pk.eyJ1IjoiMzA5NTQ4MCIsImEiOiJjbWtjbm1ibDIwMnVkM2tzY3c1cHp0dXhhIn0.2DiIx6SBBmuVf-ldsfQr_w';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/3095480/cmli9ub1t003n01r8d2nc22oi',
  center: [-4.25, 55.86],
  zoom: 13.5
});

//
const overpassQuery = `
[out:json];
(
  way["highway"="primary"](55.85,-4.35,55.90,-4.20);
  way["highway"="secondary"](55.85,-4.35,55.90,-4.20);
  way["highway"="trunk"](55.85,-4.35,55.90,-4.20);
);
out geom;
`;

const overpassUrl =
  "https://overpass-api.de/api/interpreter?data=" +
  encodeURIComponent(overpassQuery);

//
map.on('load', function () {

  fetch(overpassUrl)
    .then(response => response.json())
    .then(data => {

      const features = data.elements
        .filter(el => el.type === "way" && el.geometry)
        .map(el => ({
          type: "Feature",
          properties: {
            highway: el.tags.highway
          },
          geometry: {
            type: "LineString",
            coordinates: el.geometry.map(g => [g.lon, g.lat])
          }
        }));

      const geojson = {
        type: "FeatureCollection",
        features: features
      };

      map.addSource('major-roads', {
        type: 'geojson',
        data: geojson
      });

      map.addLayer({
        id: 'major-roads-layer',
        type: 'line',
        source: 'major-roads',
        paint: {
          'line-color': '#000000',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

    })
    .catch(err => console.error("Overpass error:", err));

});



//stations range
function updateStationsByYear(year) {
  if (!map.getLayer('stations')) return;

  map.setPaintProperty('stations', 'circle-radius', [
    'interpolate',
    ['linear'],
    ['match',
    ['get', 'site_id'],
     
'GB1044A', dataLookup['GB1044A']?.[year] ?? 0,
'GB1028A', dataLookup['GB1028A']?.[year] ?? 0,
'GB1035A', dataLookup['GB1035A']?.[year] ?? 0,
'GB0657A', dataLookup['GB0657A']?.[year] ?? 0,

      0],

//// NO₂ number
    0, 14,
    15, 12,
    20, 14,
    25, 16,
    30, 18,
    35, 20,
    40, 22,
    45, 24,
    50, 26,
    55, 28,
    60, 30
  ]);
}


/////
/////////////

let currentYear = '2018';
let dataLookup = {};
const STATION_LAYER_ID = 'stations';

map.on('load', () => {
  updateStationsByYear(currentYear);
});

/////////NO2_data.CSV

Papa.parse('https://raw.githubusercontent.com/3124252931-hash/Huoran.github.io/main/glasgow-air-quality/Glasgow_no2_data.csv', {
  download: true,
  header: true,
  complete: function (results) {

    console.log('CSV sample:', results.data.slice(0, 5));
results.data.forEach(row => {
      if (
        row.parameter === 'Nitrogen dioxide' &&
        row.site_id &&
        row.year &&
        row.annual_mean
      ) {
        if (!dataLookup[row.site_id]) {
          dataLookup[row.site_id] = {};
        }
        dataLookup[row.site_id][row.year] = Number(row.annual_mean);
      }
    });
    console.log('Lookup example:', dataLookup);
  }
});

///////mousemove

const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

map.on('mousemove', e => {
const features = map.queryRenderedFeatures(e.point, {
    layers: [STATION_LAYER_ID]
  });

  if (!features.length) {
    popup.remove();
    map.getCanvas().style.cursor = '';
    return;
  }

  const feature = features[0];
  const props = feature.properties;
  const siteId = props.site_id;
  const siteName = props.site_name || 'Unknown site';
  const value = dataLookup?.[siteId]?.[currentYear];

  map.getCanvas().style.cursor = 'pointer';

  popup
    .setLngLat(feature.geometry.coordinates)
    .setHTML(`
      <strong>${siteName}</strong><br/>
      Year: ${currentYear}<br/>
      NO₂: ${value !== undefined ? value + ' µg/m³' : 'No data'}
    `)
    .addTo(map);
});

//////year dots

const years = ['2018', '2019', '2020', '2021', '2022', '2023'];
const yearContainer = document.getElementById('year-selector');

yearContainer.innerHTML = '';

years.forEach(year => {
  const dot = document.createElement('div');
  dot.className = 'year-dot';
  dot.textContent = year;

  if (year === currentYear) {
    dot.classList.add('active');
  }

  dot.addEventListener('click', () => {
    console.log('clicked year:', year); 
    currentYear = year;

    updateStationsByYear(year);
    document.querySelectorAll('.year-dot')
      .forEach(d => d.classList.remove('active'));
    dot.classList.add('active');

    popup.remove();
  });

  yearContainer.appendChild(dot);
});

map.addControl(new mapboxgl.NavigationControl(), "top-left"); 

map.addControl( 
new mapboxgl.GeolocateControl({ 
positionOptions: { 
enableHighAccuracy: true 
}, 
trackUserLocation: true, 
showUserHeading: true 
}), 
"top-left" 
);