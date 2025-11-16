import { createNavigationContainerRef } from "@react-navigation/native";

export enum RouteNavigator {
  Home = 'Home',
  History = 'History',
  TabNav = 'TabNav',
}
export enum Route {
  logIn = 'logIn',
}


 export const navigationRef = createNavigationContainerRef();