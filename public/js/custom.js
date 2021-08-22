// common options for places library

options		= {
  types: ['geocode'], componentRestrictions: { country: 'bd' }
}
// initializing autocomplete
function initAutocomplete () {
  autocomplete = new google.maps.places.Autocomplete(document.getElementById('autocomplete'), options)
}
