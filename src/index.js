import 'leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import _ from 'underscore';
import $ from 'jquery';
import { View } from 'backbone.marionette';
import icon from './reindeer.png';
import 'leaflet-mouse-position';
import 'leaflet-measure'
import 'leaflet-measure/dist/leaflet-measure.css';



const map = L.map('map').setView([47.28499, 39.75072], 13);
const MARKERS_STORAGE_NAME = 'markers';
const markersMap = JSON.parse(localStorage.getItem(MARKERS_STORAGE_NAME)) || {};
const leafletMarkersMap = {};
L.control.mousePosition().addTo(map);
const measureOpt = L.control.measure({
	//  control position
	position: 'topleft',
	//  weather to use keyboard control for this plugin
	keyboard: true,
	//  shortcut to activate measure
	activeKeyCode: 'M'.charCodeAt(0),
	//  shortcut to cancel measure, defaults to 'Esc'
	cancelKeyCode: 27,
	//  line color
	lineColor: 'red',
	//  line weight
	lineWeight: 2,
	//  line dash
	lineDashArray: '6, 6',
	//  line opacity
	lineOpacity: 1,
	//  distance formatter
	// formatDistance: function (val) {
	//   return Math.round(1000 * val / 1609.344) / 1000 + 'mile';
	// }
}).addTo(map)

if (Object.keys(markersMap).length === 0) {
	createMarker('test', 'A pretty CSS3 popup.<br> Easily customizable.', 47.28499, 39.75072, Date.now());
}

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

renderAllMarkers();

function addMarker(name, description, lat, lng, uuid) {
	const markerIcon = L.icon({
		iconUrl: icon,
		iconSize: [50, 50],
		iconAnchor: [22, 94],
		popupAnchor: [-3, -76],
	});

	const marker = L.marker([lat, lng], { title: name, draggable: true, icon: markerIcon }).addTo(map)
		.bindPopup(`Название: ${name !== undefined ? name : name = ''} <br> 
			Описание: ${description !== undefined ? description : description = ''}`)
		.on('dragend', (e) => {
			const { lat, lng } = e.target.getLatLng();
			addMarkerToStorage(name, description, lat, lng, uuid);
		})
		.on('click', (e) => onClick(e, uuid));

	leafletMarkersMap[uuid] = marker;
}

function updateLocalStorage(obj) {
	localStorage.setItem(MARKERS_STORAGE_NAME, JSON.stringify(obj));
}

function addMarkerToStorage(name, description, lat, lng, uuid) {
	markersMap[name] = { name, description, lat, lng, uuid };
	updateLocalStorage(markersMap);
}

function createMarker(name, description, lat, lng, uuid) {
	addMarker(name, description, lat, lng, uuid);
	addMarkerToStorage(name, description, lat, lng, uuid);
}

function renderAllMarkers() {
	Object.keys(markersMap).forEach(key => {
		const { name, description, lat, lng } = markersMap[key];
		addMarker(name, description, lat, lng, Date.now());
	});
}

let isOpened = false;
let view = null;

function onClick(e, uuid) {
	if (isOpened && view) {
		view.destroy();
	}

	view = new MyView();
	view.render();
	view.lat = e.latlng.lat;
	view.lng = e.latlng.lng;
	view.uuid = uuid;
	$('body').append(view.$el);
}

map.on('click', (e) => onClick(e, Date.now()));

const MyView = View.extend({
	tagName: 'div',
	className: 'options',
	template: _.template('<input class="title" placeholder="Название"><br><input class="description" placeholder="Описание"><button class="submit">Подтвердить</button>'),
	events: {
		'change .title': 'onTitleChange',
		'change .description': 'onDescriptionChange',
		'click .submit': 'addMarker',
	},

	onTitleChange(e) {
		this.title = e.target.value;
	},

	onDescriptionChange(e) {
		this.description = e.target.value;
	},

	addMarker() {
		const marker = leafletMarkersMap[this.uuid];

		if (marker) {
			marker.remove();
			delete leafletMarkersMap[this.uuid]
		}

		const uuid = Date.now();
		createMarker(this.title, this.description, this.lat, this.lng, uuid);
		leafletMarkersMap[uuid].openPopup();
		this.destroy();
	},

	onRender() {
		isOpened = true;
	},

	onDestroy() {
		isOpened = false;
	}
});


// trap click