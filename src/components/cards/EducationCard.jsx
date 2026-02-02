import React from "react";
import styled, { useTheme } from "styled-components";
import { VerticalTimelineElement } from "react-vertical-timeline-component";

const Top = styled.div`
  width: 100%;
  display: flex;
  max-width: 100%;
  gap: 12px;
`;
const Image = styled.img`
  width: 50px;
  height: 50px;
  min-width: 50px;
  object-fit: contain;
  object-position: center;
  border-radius: 8px;
  margin-top: 4px;
  background-color: ${({ theme }) => theme.white};
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.primary}30;
  box-shadow: ${({ theme }) => theme.bg === "#000000" 
    ? "0 2px 8px rgba(0, 0, 0, 0.3)" 
    : "0 2px 8px rgba(0, 0, 0, 0.1)"};

  @media only screen and (max-width: 768px) {
    width: 40px;
    height: 40px;
    min-width: 40px;
    padding: 4px;
  }
`;
const Body = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Name = styled.div`
  font-size: 18px;
  font-weight: 600px;
  color: ${({ theme }) => theme.text_primary + 99};

  @media only screen and (max-width: 768px) {
    font-size: 14px;
  }
`;
const Degree = styled.div`
  font-size: 14px;
  font-weight: 500px;
  color: ${({ theme }) => theme.text_secondary + 99};

  @media only screen and (max-width: 768px) {
    font-size: 12px;
  }
`;
const Date = styled.div`
  font-size: 12px;
  font-weight: 400px;
  color: ${({ theme }) => theme.text_secondary + 80};

  @media only screen and (max-width: 768px) {
    font-size: 10px;
  }
`;
const Grade = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_secondary + 99};
  @media only screen and (max-width: 768px) {
    font-size: 12px;
  }
`;

const Description = styled.div`
  width: 100%;
  font-size: 15px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_primary + 99};
  margin-bottom: 10px;
  @media only screen and (max-width: 768px) {
    font-size: 12px;
  }
`;
const Span = styled.div``;

const EducationCard = ({ education }) => {
  const theme = useTheme();
  return (
    <VerticalTimelineElement
      icon={
        <img
          width="100%"
          height="100%"
          alt={education.school}
          style={{ 
            borderRadius: "50%", 
            objectFit: "cover",
            border: "2px solid #1d4290",
            boxShadow: "0 0 0 3px rgba(18, 174, 158, 0.2)"
          }}
          src={education.img}
        />
      }
      contentStyle={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: theme.card,
        color: theme.text_primary,
        boxShadow: `${theme.primary}33 0px 4px 24px`,
        backgroundColor: theme.card,
        border: `1px solid ${theme.primary}40`,
        borderRadius: "6px",
      }}
      contentArrowStyle={{
        borderRight: `7px solid ${theme.primary}50`,
      }}
      date={education.date}
    >
      <Top>
        <Image src={education.img} />
        <Body>
          <Name>{education.school}</Name>
          <Degree>{education.degree}</Degree>
          <Date>{education.date}</Date>
        </Body>
      </Top>
      <Grade>
        <b>Grade :</b>
        {education.grade}
      </Grade>
      <Description>
        <Span>{education.desc}</Span>
      </Description>
    </VerticalTimelineElement>
  );
};

export default EducationCard;
