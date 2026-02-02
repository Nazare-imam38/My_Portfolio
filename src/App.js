import styled, { ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "./utils/Themes";
import Navbar from "./components/Navbar";
import { BrowserRouter } from "react-router-dom";
import Hero from "./components/sections/Hero";
import Skills from "./components/sections/Skills";
import Education from "./components/sections/Education";
import Experience from "./components/sections/Experience";
import Projects from "./components/sections/Projects";
import Contact from "./components/sections/Contact";
import Footer from "./components/sections/Footer";
import ProjectDetails from "./components/Dialog/ProjectDetails";
import { useState, useEffect } from "react";

const Body = styled.div`
  background-color: ${({ theme }) => theme.bg};
  width: 100%;
  overflow-x: hidden;
  position: relative;
`;

const Wrapper = styled.div`
  padding-bottom: 100px;
  background: ${({ theme }) =>
    theme.bg === "#000000"
      ? `linear-gradient(
          38.73deg,
          rgba(255, 140, 66, 0.12) 0%,
          rgba(255, 140, 66, 0) 50%
        ),
        linear-gradient(
          141.27deg,
          rgba(255, 107, 53, 0) 50%,
          rgba(255, 107, 53, 0.12) 100%
        )`
      : `linear-gradient(
          38.73deg,
          rgba(255, 140, 66, 0.08) 0%,
          rgba(255, 140, 66, 0) 50%
        ),
        linear-gradient(
          141.27deg,
          rgba(255, 107, 53, 0) 50%,
          rgba(255, 107, 53, 0.08) 100%
        )`};
  width: 100%;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 30% 98%, 0 100%);
`;

function App() {
  const [openModal, setOpenModal] = useState({ state: false, project: null });
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <BrowserRouter>
        <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
        <Body>
            <div>
              <Hero />
              <Wrapper>
                <Skills />
                <Experience />
              </Wrapper>
              <Projects openModal={openModal} setOpenModal={setOpenModal} />
              <Wrapper>
                <Education />
                <Contact />
              </Wrapper>
              <Footer />

              {openModal.state && (
                <ProjectDetails
                  openModal={openModal}
                  setOpenModal={setOpenModal}
                />
              )}
            </div>
        </Body>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
