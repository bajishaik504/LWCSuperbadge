import { LightningElement,wire,track,api} from 'lwc';
import getBoatsByLocation from "@salesforce/apex/BoatDataService.getBoatsByLocation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
  @api boatTypeId;
  @track mapMarkers = [];
  isLoading = true;
  isRendered;
  latitude;
  longitude;
  
  // Add the wired method from the Apex Class
  // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
  // Handle the result and calls createMapMarkers
  @wire(getBoatsByLocation,{latitude:'$latitude',longitude:'$longitude',boatTypeId:'$boatTypeId'})
  wiredBoatsJSON({error, data}) { 
      if(data){
          this.createMapMarkers(data);
          this.isLoading=false;
      } 
      else if(error){
          var errmessage; 
          this.isLoading=false;
          if (Array.isArray(error.body)) {
                errmessage = error.body.map(e => e.message).join(', ');
          } else if (typeof error.body.message === 'string') {
                errmessage = error.body.message;
          }
          const evt = new ShowToastEvent({
            title: ERROR_TITLE,
            message: errmessage,
            variant: ERROR_VARIANT,
          });
          this.dispatchEvent(evt);
      }

  }
  
  // Controls the isRendered property
  // Calls getLocationFromBrowser()
  renderedCallback() { 
      this.getLocationFromBrowser();
      this.isRendered = true;
  }
  
  // Gets the location from the Browser
  // position => {latitude and longitude}
  getLocationFromBrowser() { 
      navigator.geolocation.getCurrentPosition(position=>{
         this.latitude = position.coords.latitude;
         this.longitude = position.coords.longitude;
      });

  }
  
  // Creates the map markers
  createMapMarkers(boatData) {
        let boats = JSON.parse(boatData);
        this.mapMarkers = boats.map(boat => {
            return {
                location: {
                Latitude: boat.Geolocation__Latitude__s,
                Longitude: boat.Geolocation__Longitude__s
                },
                title: boat.Name
            };
            
        });
        this.mapMarkers.unshift({
            location: {
                Latitude: this.latitude,
                Longitude: this.longitude
            },
            title: LABEL_YOU_ARE_HERE,
            icon: ICON_STANDARD_USER
        });

        this.isLoading = false;
   }
}