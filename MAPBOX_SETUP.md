# Mapbox 3D Map Setup Guide

## Overview
The portfolio now features an interactive 3D Mapbox map with extruded buildings in the Hero section, showcasing GIS expertise.

## Setup Instructions

### 1. Get a Free Mapbox Access Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account (or log in if you already have one)
3. Navigate to your [Access Tokens page](https://account.mapbox.com/access-tokens/)
4. Copy your default public token or create a new one

### 2. Add Token to Your Project

**Option A: Using Environment Variables (Recommended)**

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add your token:
   ```
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
   ```
3. Restart your development server

**Option B: Direct in Code**

1. Open `src/components/Map3D.jsx`
2. Find the line: `// mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';`
3. Uncomment and add your token:
   ```javascript
   mapboxgl.accessToken = 'pk.your_actual_token_here';
   ```

### 3. Features

- **3D Building Extrusions**: Buildings are displayed in 3D with height data
- **Interactive Navigation**: Users can zoom, pan, and rotate the map
- **Auto-Rotation**: The map slowly rotates to show the 3D effect
- **Custom Styling**: Matches your portfolio's navy blue theme (#1d4290)
- **Responsive**: Works on all screen sizes

### 4. Customization

You can customize the map in `src/components/Map3D.jsx`:

- **Location**: Change `center` coordinates to focus on a different city
- **Zoom Level**: Adjust the `zoom` value (higher = more zoomed in)
- **Pitch**: Change `pitch` angle (0-60 degrees) for different 3D viewing angles
- **Building Color**: Modify `fill-extrusion-color` in the layer paint properties
- **Rotation Speed**: Adjust the rotation interval and duration

### 5. Mapbox Free Tier Limits

- 50,000 map loads per month (free)
- Perfect for portfolio websites
- No credit card required

## Troubleshooting

**Map not loading?**
- Check that your Mapbox token is correctly set
- Verify the token has the correct permissions
- Check browser console for error messages

**Buildings not showing in 3D?**
- Ensure you're zoomed in enough (zoom level 14+)
- Some areas may not have 3D building data
- Try a different location with known 3D building data (like major cities)

**Performance issues?**
- The map is optimized for performance
- On slower devices, you can reduce the pitch angle or disable auto-rotation

## Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [3D Buildings Example](https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/)
- [Mapbox Styles](https://docs.mapbox.com/api/maps/styles/)

