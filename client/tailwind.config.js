// // /** @type {import('tailwindcss').Config} */
// // export default {
// //   content: [
// //     "./index.html",
// //     "./src/**/*.{js,ts,jsx,tsx}",
// //   ],
// //   theme: {
// //     extend: {},
// //   },
// //   plugins: [],
// //   fontFamily: {
// //     baloo: ['"Baloo 2"', 'cursive'],  
// //   },
// //   strokeWidth: {
// //     '2': '2px',
// //   },
// // }

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       textStrokeWidth: {
//         '1': '1px',
//         '2': '2px',
//         '4': '4px',
//       },
//       textStrokeColor: {
//         black: '#000',
//         white: '#fff',
//       }
//     },
//       colors: {
//         'custom-grey': '#676161',  // Another example color
//         // Add more custom colors as needed
//         'neon-pink': '#FF0099',
//         'neon-blue': '#00FFFF',
//         'electric-purple': '#9932CC',
//         'lime-green': '#32CD32',
//       },
//     },
//   },
//   plugins: [
//     function ({ addUtilities }) {
//       const newUtilities = {
//         '.text-stroke-1': {
//           '-webkit-text-stroke': '1px',
//         },
//         '.text-stroke-2': {
//           '-webkit-text-stroke': '2px',
//         },
//         '.text-stroke-black': {
//           '-webkit-text-stroke-color': 'black',
//         },
//         '.text-stroke-white': {
//           '-webkit-text-stroke-color': 'white',
//         },
//       }
//       addUtilities(newUtilities)
//     }
//   ],
//   fontFamily: {
//     baloo: ['"Baloo 2"', 'cursive'],  
//   },
//   strokeWidth: {
//     '2': '2px',
//   },
// }

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      textStrokeWidth: {
        '1': '1px',
        '2': '2px',
        '4': '4px',
      },
      textStrokeColor: {
        black: '#000',
        white: '#fff',
      },
      colors: {
        'custom-grey': '#676161',  // Example color
        'neon-pink': '#FF0099',
        'neon-blue': '#00FFFF',
        'electric-purple': '#9932CC',
        'lime-green': '#32CD32',
      },
      fontFamily: {
        baloo: ['"Baloo 2"', 'cursive'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-stroke-1': {
          '-webkit-text-stroke': '1px',
        },
        '.text-stroke-2': {
          '-webkit-text-stroke': '2px',
        },
        '.text-stroke-black': {
          '-webkit-text-stroke-color': 'black',
        },
        '.text-stroke-white': {
          '-webkit-text-stroke-color': 'white',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
}

