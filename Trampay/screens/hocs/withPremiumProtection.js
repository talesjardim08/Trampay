// src/hocs/withPremiumProtection.js
import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const withPremiumProtection = (WrappedComponent, navigation) => {
  return (props) => {
    const { user } = useContext(AuthContext);

    useEffect(() => {
      if (!user || !user.is_premium) {
        // redireciona para tela de assinatura
        props.navigation.navigate('AssinePro');
      }
    }, [user]);

    if (!user || !user.is_premium) {
      return null;
    }
    return <WrappedComponent {...props} />;
  };
};

export default withPremiumProtection;
