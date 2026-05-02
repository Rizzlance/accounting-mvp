import { createContext, useContext, useState } from 'react';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {

  const [company, setCompany] = useState(
    JSON.parse(localStorage.getItem('company')) || null
  );

  const switchCompany = (c) => {
    setCompany(c);
    localStorage.setItem('company', JSON.stringify(c));
  };

  return (
    <CompanyContext.Provider value={{ company, switchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);