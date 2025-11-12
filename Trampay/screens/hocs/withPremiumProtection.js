// src/hocs/withPremiumProtection.js
import React, { useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../../AuthContext';

const withPremiumProtection = (WrappedComponent) => {
  return (props) => {
    const { isPro, user } = useContext(AuthContext);

    useEffect(() => {
      if (!isPro && user) {
        // redireciona para tela de assinatura
        Alert.alert(
          "Recurso Premium",
          "Este recurso é exclusivo para usuários PRO.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Assinar PRO", onPress: () => props.navigation.navigate('AssinePro') }
          ]
        );
        props.navigation.goBack();
      }
    }, [isPro, user]);

    if (!isPro) {
      return null;
    }
    return <WrappedComponent {...props} />;
  };
};

export default withPremiumProtection;
