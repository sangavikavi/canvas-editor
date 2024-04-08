import React, { useRef, useEffect, useState } from "react";
import { ChromePicker } from "react-color";
import { dummyData } from "./constants";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button from '@mui/material/Button';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faArrowDown } from "@fortawesome/free-solid-svg-icons";

function wrapText(context, text, x, y, lineHeight, fitWidth) {
  fitWidth = fitWidth || 0;
  const maxCharactersPerLine = 30;

  if (fitWidth <= 0) {
    context.fillText(text, x, y);
    return;
  }

  let words = text.split(" ");
  let line = "";
  words.forEach((word, index) => {
    const testLine = (index === 0 ? "" : line + " ") + word; // Remove leading space for the first word
    if (testLine.length > maxCharactersPerLine) {
      context.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  });

  context.fillText(line, x, y);
}

const App = () => {
  const canvasRef = useRef();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [captionText, setCaptionText] = useState(dummyData.caption.text);
  const [ctaText, setCtaText] = useState(dummyData.cta.text);
  const [lastThreeColors, setLastThreeColors] = useState([]);
  const [color, setColor] = useState(); // Initial color
  const [showColorPicker, setShowColorPicker] = useState(false); // State to toggle color picker visibility
  const [heightRange, setHeightRange] = useState(15);
  const [widthRange, setWidthRange] = useState(115);
  const [yRange, setYRange] = useState(185);

  const resetToDefault = () => {
    setWidthRange(115);
    setHeightRange(15);
    setYRange(185);
  };

  const handleColorChange = (selectedColor) => {
    setColor(selectedColor.hex);
    setLastThreeColors((prevColors) => {
      if (prevColors.length >= 3) {
        prevColors.pop(); // Remove the oldest color
      }
      const colors_array = [selectedColor.hex, ...prevColors];
      localStorage.setItem("colors", JSON.stringify(colors_array));
      return colors_array; // Add the new color to the beginning
    });
  };

  const handleCaptionTextChange = (event) => {
    setCaptionText(event.target.value.trim() || dummyData.caption.text);
  };

  const handleCTATextChange = (event) => {
    setCtaText(event.target.value.trim() || dummyData.cta.text);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result;
        setPreviewUrl(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerInputFile = () => {
    fileInputRef.current.click();
  };

  const correctionFactors = {
    height: heightRange,
    width: widthRange,
    y: yRange,
  };

  useEffect(() => {
    const colors = localStorage.getItem("colors");
    if (colors) {
      const parsedColors = JSON.parse(colors);
      setLastThreeColors(parsedColors);
      console.log(parsedColors[0])
      setColor(parsedColors[0]); 
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const mask = new Image();
    const designPattern = new Image();
    const stroke = new Image();

    mask.src = dummyData.urls.mask;
    designPattern.src = dummyData.urls.design_pattern;
    stroke.src = dummyData.urls.stroke;

    mask.onload = () => {
      canvas.width = mask.width;
      canvas.height = mask.height;

      context.fillStyle = color;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(mask, 0, 0);
      context.drawImage(designPattern, 0, 0, canvas.width, canvas.height);

      if (previewUrl) {
        const image = new Image();
        image.src = previewUrl;

        image.onload = () => {
          const scaleFactor = Math.min(
            mask.width / image.width,
            mask.height / image.height
          );

          const scaledWidth =
            image.width * scaleFactor - correctionFactors.width;
          const scaledHeight =
            image.height * scaleFactor - correctionFactors.height;

          const x = (mask.width - scaledWidth) / 2;
          const y = (mask.height - scaledHeight) / 2 + correctionFactors.y;

          context.drawImage(image, x, y, scaledWidth, scaledHeight);
        };
      }

      const { caption } = dummyData;
      context.font = `${caption.font_size}px Arial`;
      context.fillStyle = caption.text_color;
      context.textAlign = caption.alignment;
      context.textBaseline = "top";
      wrapText(
        context,
        captionText,
        caption.position.x,
        caption.position.y,
        60,
        800
      );

      const { cta } = dummyData;
      const ctaWidth = 270;
      const ctaHeight = 100;
      const ctaX = cta.position.x - ctaWidth / 2;
      const ctaY = cta.position.y - ctaHeight / 2;
      context.fillStyle = cta.background_color;
      context.fillRect(ctaX, ctaY, ctaWidth, ctaHeight);
      context.font = "35px Arial";
      context.fillStyle = cta.text_color;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(ctaText, cta.position.x, cta.position.y);
    };
  }, [
    previewUrl,
    captionText,
    ctaText,
    color,
    heightRange,
    widthRange,
    yRange,
  ]);

  return (
    <div className="bg-slate-100 flex flex-row items-center justify-center justify-evenly w-full h-screen font-poppins">
      <div>
        <canvas
          className="border-4 rounded h-[500px] w-[500px]"
          ref={canvasRef}
        ></canvas>
      </div>
      <div className="flex flex-col font-poppins">
        <h1 className="text-center text-[20px] font-bold my-1">
          Ad customization
        </h1>
        <p className="text-center text-[12px] italic mb-3 text-slate-500">
          Customize your ad and get the templates accordingly
        </p>

        <div className="relative my-3 mt-5 border-2 border-gray-300 p-3 rounded flex items-center">
          <label
            htmlFor="imageUpload"
            className="text-gray-700 flex items-center mr-2 text-slate-500 text-[14px]"
          >
            <FontAwesomeIcon icon={faImage} className="mr-2 text-blue-600" />
            Change the ad creative image:
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <a
            href="#"
            onClick={triggerInputFile}
            className="underline text-blue-600 cursor-pointer text-[15px]"
          >
            Select File
          </a>
        </div>
        {/*Edit contents */}
        <div className="container my-5 flex items-center">
          <div className="flex-grow border-t border-slate-400"></div>
          <h2 className="title text-sm font-normal text-slate-400 mx-4">
            Edit contents
          </h2>
          <div className="flex-grow border-t border-slate-400"></div>
        </div>

        <TextField
          sx={{
            width: 600,
            marginTop: 3,
            marginBottom: 2,
            border: 1,
            borderRadius: 2,
          }}
          id="outlined-basic"
          className="text-slate-200 margin"
          label="Ad content"
          variant="outlined"
          onChange={(e) => handleCaptionTextChange(e)}
        />
        <TextField
          sx={{
            width: 600,
            marginTop: 1,
            marginBottom: 1,
            border: 1,
            borderRadius: 2,
          }}
          id="outlined-basic"
          className="text-slate-200"
          label="CTA"
          variant="outlined"
          onChange={(e) => handleCTATextChange(e)}
        />
        <p className="text-[14px] font-light italic mt-5 text-slate-500">
          Choose your color
        </p>
        <div className="flex flex-row">
          {/* Color Picker Button */}
          <div className="relative mr-5 mt-5">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="bg-slate-300 border-solid hover:border-dotted rounded-full my-1  px-3 py-1 font-medium text-[20px] cursor-pointer  border hover:border-dotted hover:border-gray-500"
            >
              +
            </button>
            {/* Color Picker Popover */}
            {showColorPicker && (
              <div className="absolute top-10 right-0 left-0 mt-6 z-40">
                <ChromePicker
                  color={color}
                  onChange={handleColorChange}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Display last three selected colors */}
          <div className="flex items-center mt-5">
            {lastThreeColors.map((col, index) => (
              <div
                key={index}
                className="rounded-full w-8 h-8 mr-2 cursor-pointer"
                style={{ backgroundColor: col }}
                onClick={() => setColor(col)}
              />
            ))}
          </div>
        </div>
        <div className=" mt-5">
          <Accordion>
            <AccordionSummary
              expandIcon={<FontAwesomeIcon icon={faArrowDown} className="mr-2 text-blue-600" />}
            >
              <Typography>Advanced Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography id="height-range-slider" gutterBottom>
                Height
              </Typography>
              <Slider
                min={-1000}
                max={1000}
                step={1} // Set step to 1 to stop at whole values
                value={heightRange}
                onChange={(e, newValue) => setHeightRange(newValue)}
              />
              <Typography id="height-range-slider" gutterBottom>
                Width
              </Typography>
              <Slider
                min={-1000}
                max={1000}
                step={1} // Set step to 1 to stop at whole values
                value={widthRange}
                onChange={(e, newValue) => setWidthRange(newValue)}
              />
              <Typography id="height-range-slider" gutterBottom>
                Y
              </Typography>
              <Slider
                min={-1000}
                max={1000}
                step={1} // Set step to 1 to stop at whole values
                value={yRange}
                onChange={(e, newValue) => setYRange(newValue)}
              />
              <Button variant="contained"  onClick={resetToDefault}>Reset to Default Values</Button>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default App;