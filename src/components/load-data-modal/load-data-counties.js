import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {CORS_LINK} from '../../constants/default-settings';
import fipsGeoJson from '../../data/fips-geojson';

const propTypes = {
  onLoadDataCounties: PropTypes.func.isRequired
};

const StyledDescription = styled.div`
  font-size: 14px;
  color: ${props => props.theme.labelColorLT};
  line-height: 18px;
  margin-bottom: 12px;
`;

const InputForm = styled.div`
  flex-grow: 1;
  padding: 32px;
  background-color: ${props => props.theme.panelBackgroundLT};
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.inputPadding};
  color: ${props => (props.error ? 'red' : props.theme.titleColorLT)};
  height: ${props => props.theme.inputBoxHeight};
  border: 0;
  outline: 0;
  font-size: ${props => props.theme.inputFontSize};

  :active,
  :focus,
  &.focus,
  &.active {
    outline: 0;
  }
`;

const StyledFromGroup = styled.div`
  margin-top: 30px;
  display: flex;
  flex-direction: row;
`;

export const StyledInputLabel = styled.div`
  font-size: 11px;
  color: ${props => props.theme.textColorLT};
  letter-spacing: 0.2px;
  ul {
    padding-left: 12px;
  }
`;

export const StyledBtn = styled.button`
  background-color: ${props => props.theme.primaryBtnActBgd};
  color: ${props => props.theme.primaryBtnActColor};
`;

export const StyledError = styled.div`
  color: red;
`;

export const StyledErrorDescription = styled.div`
  font-size: 14px;
`;

const Error = ({error, url}) => (
  <StyledError>
    <StyledErrorDescription>{url}</StyledErrorDescription>
    <StyledErrorDescription>{error.message}</StyledErrorDescription>
  </StyledError>
);

class LoadDataCounties extends Component {
  constructor(props) {
    super(props);
  }
  onMapUrlChange = e => {
  };


  onLoadDataCounties = () => {
    const baseUrl= "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/";
    const dataUrls = [];
    
    var date1 = new Date("03/23/2020"); 
    var date2 = new Date(); 

    // To calculate the time difference of two dates
    var Difference_In_Time = date2.getTime() - date1.getTime(); 

    // To calculate the no. of days between two dates
    var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
    
    for (var i = 0; i < Math.floor(Difference_In_Days) ; i++){
      var dd = date1.getDate();

      var mm = date1.getMonth()+1; 
      const yyyy = date1.getFullYear();

      if(dd<10) 
      {
        dd=`0${dd}`;
      } 

      if(mm<10) 
      {
        mm=`0${mm}`;
      } 
      const dateString = `${mm}-${dd}-${yyyy}`;


      dataUrls.push(baseUrl+ dateString + ".csv" )

      date1.setDate(date1.getDate() + 1)
    }

    const options = {dataUrls: dataUrls, fipsGeoJson: fipsGeoJson}
    this.props.onLoadDataCounties(options);

  };

  render() {
    return (
      <div>
        <InputForm>
          <StyledDescription>Johns Hopkins Latest Data</StyledDescription>
          <StyledInputLabel>Broken down by counties in the US</StyledInputLabel>
          <StyledInputLabel>
            Sources:
            <ul>
              <li>https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports</li>
            </ul>
          </StyledInputLabel>
          <StyledFromGroup>
            <StyledBtn type="submit" onClick={this.onLoadDataCounties}>
              Fetch
            </StyledBtn>
          </StyledFromGroup>
        </InputForm>
      </div>
    );
  }
}

LoadDataCounties.propTypes = propTypes;

export default LoadDataCounties;
