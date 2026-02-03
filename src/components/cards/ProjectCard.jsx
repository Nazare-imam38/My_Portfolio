import React, { useState } from "react";
import styled from "styled-components";

const ImageContainer = styled.div`
  width: 100%;
  height: 180px;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.white};
  box-shadow: ${({ theme }) => theme.bg === "#000000" ? "0 0 16px 2px rgba(0, 0, 0, 0.5)" : "0 0 16px 2px rgba(0, 0, 0, 0.1)"};
  border: 1px solid ${({ theme }) => theme.primary}20;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: ${({ imageCount }) => imageCount === 2 ? '1fr 1fr' : '1fr 1fr 1fr'};
  gap: 4px;
  width: 100%;
  height: 100%;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.3s ease-in-out;
  ${({ isHovered }) => isHovered && `
    opacity: 1;
  `}
`;

const GridImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  transition: transform 0.3s ease-in-out;
  &:hover {
    transform: scale(1.05);
  }
`;

const SingleImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: all 0.3s ease-in-out;
  opacity: ${({ isHovered, hasMultipleImages }) => (hasMultipleImages && isHovered ? 0 : 1)};
`;

const Card = styled.div`
  width: 330px;
  height: 490px;
  background-color: ${({ theme }) => theme.card};
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.primary}20;
  box-shadow: ${({ theme }) => theme.primary}10 0px 2px 8px;
  overflow: hidden;
  padding: 26px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.5s ease-in-out;
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 0 30px ${({ theme }) => theme.primary}50;
    filter: brightness(1.1);
    border: 1px solid ${({ theme }) => theme.primary};
  }
`;

const Tags = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;
const Tag = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.primary};
  background-color: ${({ theme }) => theme.primary + 15};
  padding: 2px 8px;
  border-radius: 10px;
`;
const Details = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0px;
  padding: 0px 2px;
`;
const Title = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_secondary};
  overflow: hidden;
  display: -webkit-box;
  max-width: 100%;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const Date = styled.div`
  font-size: 12px;
  margin-left: 2px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_secondary + 80};
  @media only screen and (max-width: 768px) {
    font-size: 10px;
  }
`;
const Description = styled.div`
  font-weight: 400;
  color: ${({ theme }) => theme.text_secondary + 99};
  overflow: hidden;
  margin-top: 8px;
  display: -webkit-box;
  max-width: 100%;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
`;
const Members = styled.div`
  display: flex;
  align-items: center;
  padding-left: 10px;
`;
const Avatar = styled.img`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  margin-left: -10px;
  object-fit: cover;
  object-position: center;
  background-color: ${({ theme }) => theme.white};
  box-shadow: ${({ theme }) => theme.bg === "#000000" ? "0 0 10px rgba(0, 0, 0, 0.5)" : "0 0 10px rgba(0, 0, 0, 0.2)"};
  border: 3px solid ${({ theme }) => theme.card};
  transition: transform 0.2s ease-in-out;
  &:hover {
    transform: scale(1.1);
    z-index: 10;
    position: relative;
  }
`;

const ProjectCard = ({ project, setOpenModal }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Support both single image (backward compatible) and multiple images
  const images = project.images || (project.image ? [project.image] : []);
  const hasMultipleImages = images.length > 1;
  
  return (
    <Card 
      onClick={() => setOpenModal({ state: true, project: project })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ImageContainer>
        {hasMultipleImages ? (
          <>
            <SingleImage 
              src={images[0]} 
              alt={project.title}
              isHovered={isHovered}
              hasMultipleImages={true}
            />
            <ImageGrid 
              isHovered={isHovered} 
              imageCount={images.length}
            >
              {images.map((img, index) => (
                <GridImage 
                  key={index} 
                  src={img} 
                  alt={`${project.title} - Image ${index + 1}`}
                />
              ))}
            </ImageGrid>
          </>
        ) : (
          <SingleImage 
            src={images[0]} 
            alt={project.title}
            isHovered={false}
            hasMultipleImages={false}
          />
        )}
      </ImageContainer>
      <Tags>
        {project.tags?.map((tag, index) => (
          <Tag key={index}>{tag}</Tag>
        ))}
      </Tags>
      <Details>
        <Title>{project.title}</Title>
        <Date>{project.date}</Date>
        <Description>{project.description}</Description>
      </Details>
      <Members>
        {project.member?.map((member, index) => (
          <Avatar key={index} src={member.img} />
        ))}
      </Members>
    </Card>
  );
};

export default ProjectCard;
