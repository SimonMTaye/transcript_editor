import { createTheme, MantineColorsTuple } from "@mantine/core";

const myColor: MantineColorsTuple = [
  "#fff0e4",
  "#ffe0cf",
  "#fac0a1",
  "#f69e6e",
  "#f28043",
  "#f06e27",
  "#f06418",
  "#d6530c",
  "#bf4906",
  "#a73c00",
];

export const theme = createTheme({
  colors: {
    myColor,
  },
});
