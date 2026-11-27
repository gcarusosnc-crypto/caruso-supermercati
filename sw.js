self.addEventListener("push",event=>{
 let payload={title:"Caruso Incassi",body:"Hai una nuova notifica.",url:"./"};
 try{if(event.data)payload={...payload,...event.data.json()};}catch(_){if(event.data)payload.body=event.data.text();}
 event.waitUntil(self.registration.showNotification(payload.title||"Caruso Incassi",{
  body:payload.body||"Hai una nuova notifica.",
  icon:"./icons/icon-192.png",
  badge:"./icons/icon-192.png",
  data:{url:payload.url||"./"}
 }));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 const target=new URL(event.notification.data?.url||"./",self.location.href).href;
 event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
  for(const client of list){if("focus" in client)return client.focus();}
  return clients.openWindow(target);
 }));
});