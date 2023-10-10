export default function saEvent(eventName: string) {
  if (navigator.doNotTrack !== "1") {
    console.log("sa_event", eventName);

    // sa_event(eventName)
  }
}
