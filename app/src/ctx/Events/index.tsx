import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import EventBus, { EventHandler } from '../../services/EventBus';

export type EventsContext = {
  events?: EventBus<any>;
};

export const EventsContext = React.createContext<EventsContext>({});

export const WithEvents: React.FC<PropsWithChildren> = ({ children }) => {
  const [ctx, setContext] = useState({});

  useEffect(() => {
    const events = new EventBus();
    setContext({ events });
    return () => events.clear();
  }, []);

  return (
    <EventsContext.Provider value={ctx}>{children}</EventsContext.Provider>
  );
};

export const useEventHandler = <E extends Event>(
  type: E['type'],
  listener: EventHandler<E>,
) => {
  const { events } = useContext(EventsContext);

  useEffect(() => {
    events?.addEventListener(type, listener);
    return () => events?.removeEventListener(type, listener);
  }, [events]);
};
