import { LightningElement,wire,track,api} from 'lwc';
import { MessageContext,publish} from 'lightning/messageService';
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import { refreshApex } from '@salesforce/apex';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
const columns = [
    { label: 'Name', fieldName: 'Name',type:'text',editable: 'true'},
    { label: 'Length', fieldName: 'Length__c', type: 'number',editable: 'true'},
    { label: 'Price__c', fieldName: 'Price__c', type: 'currency',editable: 'true'},
    { label: 'Description', fieldName: 'Description__c', type: 'text',editable: 'true'},
];
const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT     = 'Ship it!';
const SUCCESS_VARIANT     = 'success';
const ERROR_TITLE   = 'Error';
const ERROR_VARIANT = 'error';
export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  columns = [];
  columns = columns;
  @api boatTypeId = '';
  @track boats;
  isLoading = false;
  @track draftValues = [];
  
  // wired message context
  @wire(MessageContext) messageContext;
  @wire(getBoats,{boatTypeId:'$boatTypeId'})  
  wiredBoats({error,data}) {
    if(data){
        this.boats = data;
        this.isLoading = false;
    }
    else if(error){
        this.isLoading =false;
    }
    this.notifyLoading(this.isLoading);
  
  } 
  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api searchBoats(boatTypeId) {
        this.isLoading = true;
        this.notifyLoading(this.isLoading);
        this.boatTypeId = boatTypeId;      
  }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
    async refresh() { 
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    await refreshApex(this.boats);
    this.isLoading=false;
    this.notifyLoading(this.isLoading);   
  }
  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) { 
      this.selectedBoatId = event.detail.boatId;
      this.sendMessageService(this.selectedBoatId);

  }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    const payload = { recordId: boatId };
    publish(this.messageContext, BOATMC, payload);
  }
  
  // This method must save the changes in the Boat Editor
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
     this.notifyLoading(true);
      const recordInputs = event.detail.draftValues.slice().map(draft => {
          const fields = Object.assign({}, draft);
          return { fields };
      });
      const promises = recordInputs.map(recordInput => updateRecord(recordInput));
      Promise.all(promises).then(boatrecs => {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: SUCCESS_TITLE,
                  message: MESSAGE_SHIP_IT,
                  variant: SUCCESS_VARIANT
              })
          );
          // Clear all draft values
          this.draftValues = [];

          // Display fresh data in the datatable
          return this.refresh();
      }).catch(error => {
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error.body.message,
                    variant: ERROR_VARIANT
                })
            );
            this.notifyLoading(false);

      }).finally(() => {
            this.draftValues = [];
      });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) { 
      if(isLoading){
          this.dispatchEvent(
               new CustomEvent('loading')
          );
      }
      else{
           this.dispatchEvent(
               new CustomEvent('doneloading')
          );
      }

  }
  
}