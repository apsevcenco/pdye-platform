import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [yachts, setYachts] = useState<any[]>([]);

  useEffect(() => {
    fetchYachts();
  }, []);

  async function fetchYachts() {
    const { data, error } = await supabase
      .from("yachts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setYachts(data || []);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>PDYE – Live Database</h1>

      {yachts.map((yacht) => (
        <div key={yacht.id} style={{ marginBottom: 20 }}>
          <img src={yacht.image} width="300" />
          <h2>{yacht.title}</h2>
          <p>{yacht.price}</p>
          <p>{yacht.location}</p>
        </div>
      ))}
    </div>
  );
}