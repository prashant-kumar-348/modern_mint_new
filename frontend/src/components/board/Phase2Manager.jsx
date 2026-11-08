import React from 'react';
import Phase2PlayerMatModal from '../modals/Phase2PlayerMatModal';

const Phase2Manager = ({ activeModal, setActiveModal, sendAction, localPlayer, currentRound, drawnCard, clearDrawnCard, activeEvent, teamTokenPool }) => {
  const handleClose = () => {
    setActiveModal(null);
  };

  const handlePaymentComplete = (companyName, amount, roll) => {
    // 1. Send Action to Server
    sendAction('phase2_action', {
      actionType: activeModal, // 'launch', 'stage_up', 'buy_pr'
      companyName: companyName,
      amount: Number(amount),
      roll: roll || null
    });

    if (amount && Number(amount) > 0) {
      window.dispatchEvent(new CustomEvent('fly_money', {
        detail: {
          amount: Number(amount),
          text: `-$${amount}K on ${companyName || 'Company'}`,
          type: 'spend'
        }
      }));
    }

    // 2. Close the mat modal
    setActiveModal(null);
  };

  const handleMentorAction = (type, cost) => {
    sendAction('phase2_action', {
      actionType: 'buy_mentor',
      companyName: null,
      amount: Number(cost)
    });
  };

  const isMatActive = ['launch', 'stage_up', 'buy_pr', 'upgrade_workforce'].includes(activeModal);

  return (
    <>
      {isMatActive && (
        <Phase2PlayerMatModal 
          onClose={handleClose} 
          onPaymentComplete={handlePaymentComplete}
          ownedCompanies={localPlayer?.ownedCompanies || []}
          actionType={activeModal}
          currentRound={currentRound}
          activeEvent={activeEvent}
          teamTokenPool={teamTokenPool}
          localPlayer={localPlayer}
        />
      )}
    </>
  );
};

export default Phase2Manager;
