import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import dotenv from "dotenv";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { Provider as ReactReduxProvider } from "react-redux";
import { store } from "./app/store/store";

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const colors = {
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
  
};

const theme = extendTheme({ colors });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ChakraProvider theme={theme}>
    <ReactReduxProvider store={store}>
      <App />
    </ReactReduxProvider>
  </ChakraProvider>
);
